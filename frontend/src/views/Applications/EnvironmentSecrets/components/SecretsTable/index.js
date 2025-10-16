import React, { useEffect, useState, useRef } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import EditIcon from '@material-ui/icons/Edit';
import RemoveRedEyeIcon from '@material-ui/icons/RemoveRedEye';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TableSortLabel,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  TablePagination,
  Box,
  Typography
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { getUserPayload } from "config/helper";

import {
  deleteApplicationSecret,
  getApplicationSecrets,
  getApplicationTags,
  updateApplicationSecrets,
} from "services/applications";

import styles from "./style.module.scss";
import { Button } from "components/Button";
import { Alert } from "@material-ui/lab";
import CopyToClipboard from "../CopyToClipboard";
import SecretVersions from "../SecretVersions";
// Simple diff viewer component
const SimpleDiffViewer = ({ oldValue, newValue, leftTitle, rightTitle }) => {
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className={styles.simpleDiffViewer}>
      <div className={styles.diffHeader}>
        <div className={styles.diffColumn}>
          <h4>{leftTitle}</h4>
        </div>
        <div className={styles.diffColumn}>
          <h4>{rightTitle}</h4>
        </div>
      </div>
      <div className={styles.diffContent}>
        <div className={styles.diffColumn}>
          <pre className={styles.diffOld}>{formatJson(oldValue)}</pre>
        </div>
        <div className={styles.diffColumn}>
          <pre className={styles.diffNew}>{formatJson(newValue)}</pre>
        </div>
      </div>
    </div>
  );
};

// Custom Edit Component for inline editing
function CustomEditComponent({ id, value, field, onValueChange, isOverwritten, baseValue }) {
  const [open, setOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [textAreaValue, setTextAreaValue] = useState(value || '');

  useEffect(() => {
    setTextAreaValue(value || '');
  }, [value]);

  const handleClickOpen = (type) => () => {
    setOpen(true);
    if (type === 'edit') setIsEditOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditOpen(false);
    setTextAreaValue(value || '');
  };

  const handleTextAreaChange = (e) => {
    setTextAreaValue(e.target.value);
  };

  const handleValueChange = () => {
    onValueChange(textAreaValue);
    setOpen(false);
    setIsEditOpen(false);
  };

  const getCellClassName = () => {
    if (isOverwritten) {
      return styles['overwritten-cell'];
    }
    return '';
  };

  return (
    <>
      <div className={`${styles.cellContent} ${getCellClassName()}`}>
        <CopyToClipboard textToCopy={value} label={id} field={field} />
        <Tooltip title="Edit">
          <IconButton size="small" onClick={handleClickOpen('edit')}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="View">
          <IconButton size="small" onClick={handleClickOpen('view')}>
            <RemoveRedEyeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={value || ''} placement="top" arrow>
          <span className={styles.valueText}>{value}</span>
        </Tooltip>
      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        scroll="paper"
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="scroll-dialog-title">{field} - {id}</DialogTitle>
        <DialogContent dividers={true}>
          <DialogContentText
            id="scroll-dialog-description"
            tabIndex={-1}
          >
            <TextField
              multiline
              rows={10}
              fullWidth
              variant="outlined"
              value={textAreaValue}
              onChange={handleTextAreaChange}
              disabled={!isEditOpen}
              placeholder="Enter secret value..."
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {isEditOpen && (
            <Button onClick={handleValueChange} color="primary">
              Update
            </Button>
          )}
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const SecretsTable = ({
  applicationName,
  env: envName,
  setLoading,
  loading,
}) => {
  const [secrets, setSecrets] = useState([]);
  const [secretsList, setSecretsList] = useState([]);
  const [tags, setTags] = useState([]);
  const [updatedData, setUpdatedData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [diffOpen, setDiffOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleColumnsStart, setVisibleColumnsStart] = useState(0);
  const user = getUserPayload();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Column navigation functions
  const handlePreviousColumns = () => {
    setVisibleColumnsStart(Math.max(0, visibleColumnsStart - 1));
  };

  const handleNextColumns = () => {
    const maxStart = Math.max(0, tags.length - 4); // 4 visible tag columns
    setVisibleColumnsStart(Math.min(maxStart, visibleColumnsStart + 1));
  };

  const getVisibleTags = () => {
    return tags.slice(visibleColumnsStart, visibleColumnsStart + 4);
  };

  const formatString = (unformattedString) => {
    let formattedString = "";
    for (let i = 0; i < unformattedString.length; i++) {
      formattedString = formattedString + unformattedString[i];
      if (unformattedString[i] === ",") {
        formattedString = formattedString + "\n";
      }
    }
    return formattedString;
  };

  const getTags = async () => {
    const response = await getApplicationTags(applicationName, envName);
    if (!response.isError) {
      const tagsData = response?.data || [];
      // Sort tags: base first, then alphabetically
      const sortedTags = tagsData.sort((a, b) => {
        if (a.name === 'base') return -1;
        if (b.name === 'base') return 1;
        return a.name.localeCompare(b.name);
      });
      setTags(sortedTags);
    }
  };

  useEffect(() => {
    getSecrets();
    getTags();
  }, []);

  const getSecrets = async () => {
    setLoading(true);
    try {
      const response = await getApplicationSecrets(applicationName, envName);
      if (!response.isError && response.data.length > 0) {
        setSecretsList(response?.data);
        const secret_keys = Object.keys(response?.data[0]?.secret_data?.secret).map((ele) => ele);
        
        // Get base secret data for reference
        const baseSecret = response?.data?.find(ele => ele?.tag_name === 'base');
        const baseSecretData = baseSecret?.secret_data?.secret || {};
        
        
        const rows = secret_keys?.map((key) => {
          const value = response?.data?.map((ele) => {
            const tagName = ele?.tag_name;
            const isOverwritten = ele?.secret_data?._overwrittenKeys?.includes(key) || false;
            const baseValue = baseSecretData[key] || '';
            // Show base value for keys that are fetched from base (missing or empty in tag)
            const displayValue = isOverwritten ? baseValue : (ele?.secret_data?.secret[key] || '');
            
            
            return {
              [tagName]: displayValue,
              [`${tagName}_isOverwritten`]: isOverwritten,
              [`${tagName}_baseValue`]: baseValue
            };
          });
          
          const reducedValues = value.reduce((cur, prev) => ({
            ...prev,
            ...cur,
          }), {});

          return { id: key, key: key, ...reducedValues };
        });

        setSecrets(rows);
        return rows;
      }
    } catch (error) {
      setError('Failed to fetch secrets');
    } finally {
      setLoading(false);
    }
    return [];
  };

  const findInTags = (tagName) => {
    return tags?.find((item) => item.name === tagName);
  };

  const findInUpdatedData = (secret_id) => {
    return updatedData?.findIndex((item) => item.secret_id === secret_id);
  };

  const handleCellChange = (updatedRow, originalRow, field) => {
    const changedValue = updatedRow[field];
    const originalValue = originalRow[field];
    
    if (changedValue === originalValue) return;

    const tag = findInTags(field);
    const secret_id = tag?.features?.secret_id;
    const currIndex = findInUpdatedData(secret_id);

    // Get current secret data from secretsList to merge with
    const currentSecretData = secretsList.find(secret => secret.tag_name === field)?.secret_data?.secret || {};

    if (currIndex !== -1) {
      let oldData = [...originalData];
      let newData = [...updatedData];

      // Merge current secret data with existing changes and new change
      const mergedSecretData = {
        ...currentSecretData,
        ...updatedData[currIndex]?.secret_data.secret,
        [updatedRow?.key]: changedValue
      };

      newData[currIndex].secret_data.secret = mergedSecretData;
      oldData[currIndex].secret_data.secret = {
        ...originalData[currIndex]?.secret_data.secret,
        [originalRow?.key]: originalValue,
      };

      setUpdatedData(newData);
      setOriginalData(oldData);
    } else {
      if (secret_id) {
        // Merge current secret data with the new change
        const mergedSecretData = {
          ...currentSecretData,
          [updatedRow?.key]: changedValue,
        };

        let newData = {
          secret_id: secret_id,
          tag_id: tag?.id,
          tag_name: tag?.name,
          secret_data: {
            secret: mergedSecretData,
          },
        };
        let oldData = {
          secret_id: secret_id,
          tag_id: tag?.id,
          tag_name: tag?.name,
          secret_data: {
            secret: {
              ...currentSecretData,
              [originalRow?.key]: originalValue,
            },
          },
        };

        setUpdatedData([...updatedData, newData]);
        setOriginalData([...originalData, oldData]);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { secrets: updatedData };
      const response = await updateApplicationSecrets(applicationName, envName, payload);
      if (!response.isError) {
        window.location.reload();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError("Failed to save secrets");
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelection = (id) => {
    setSelectedRowId(selectedRowId === id ? null : id);
  };

  const deleteKey = async () => {
    setLoading(true);
    try {
      if (!secrets || secrets.length === 0 || !selectedRowId) {
        return;
      }
      const payload = { secretKey: selectedRowId };
      const response = await deleteApplicationSecret(applicationName, envName, payload);
      if (!response.isError) {
        window.location.reload();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError("Failed to delete secret");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  const filteredAndSortedSecrets = secrets
    .filter(secret => 
      secret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(secret).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  if (loading) {
    return <div className={styles.loading}>Loading secrets...</div>;
  }

  return (
    <div className={styles.secretsTable}>
      {error && (
        <Alert severity="error" style={{ marginBottom: '20px' }}>
          {error}
        </Alert>
      )}

      <div className={styles.tableHeader}>
        <TextField
          placeholder="Search secrets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className={styles.searchField}
        />
        
        <div className={styles.headerActions}>
          <div className={styles.baseTagIndicator}>
            <span className={styles.indicatorIcon}>🔻</span>
            <span className={styles.indicatorText}>Fetched from base</span>
            {/* <span className={styles.indicatorIcon}>❌</span>
            <span className={styles.indicatorText}>Missing from tag</span> */}
          </div>
          
          {/* Column Navigation */}
          {tags.length > 4 && (
            <div className={styles.columnNavigation}>
              <Tooltip title="Previous columns">
                <IconButton 
                  onClick={handlePreviousColumns} 
                  disabled={visibleColumnsStart === 0}
                  size="small"
                >
                  ←
                </IconButton>
              </Tooltip>
              <span className={styles.columnInfo}>
                {visibleColumnsStart + 1}-{Math.min(visibleColumnsStart + 4, tags.length)} of {tags.length}
              </span>
              <Tooltip title="Next columns">
                <IconButton 
                  onClick={handleNextColumns} 
                  disabled={visibleColumnsStart >= tags.length - 4}
                  size="small"
                >
                  →
                </IconButton>
              </Tooltip>
            </div>
          )}
          {user.is_super_admin && (
            <Button 
              icon={<DeleteIcon />} 
              onClick={() => setConfirmDelete(true)} 
              disabled={selectedRowId === null}
              color="secondary"
            >
              Delete Secret
            </Button>
          )}
        </div>
      </div>

      <TableContainer 
        component={Paper} 
        className={styles.tableContainer}
        style={{ 
          maxHeight: '70vh', 
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%'
        }}
      >
        <Table stickyHeader style={{ tableLayout: 'fixed', minWidth: '1000px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedRowId !== null && filteredAndSortedSecrets.length > 0}
                  checked={false}
                  onChange={() => setSelectedRowId(null)}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'id'}
                  direction={sortBy === 'id' ? sortOrder : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  Key
                </TableSortLabel>
              </TableCell>
              {getVisibleTags().map((tag) => (
                <TableCell key={tag.name} style={{ minWidth: '200px', maxWidth: '200px' }}>
                  <TableSortLabel
                    active={sortBy === tag.name}
                    direction={sortBy === tag.name ? sortOrder : 'asc'}
                    onClick={() => handleSort(tag.name)}
                  >
                    {tag.name}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedSecrets
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
              <TableRow 
                key={row.id} 
                hover
                selected={selectedRowId === row.id}
                onClick={() => handleRowSelection(row.id)}
                className={selectedRowId === row.id ? styles.selectedRow : ''}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRowId === row.id}
                    onChange={() => handleRowSelection(row.id)}
                  />
                </TableCell>
                <TableCell className={styles.keyCell}>
                  <CopyToClipboard textToCopy={row.id} label={row.id} field="key" />
                  <span className={styles.keyText}>{row.id}</span>
                </TableCell>
                {getVisibleTags().map((tag) => (
                  <TableCell key={tag.name} className={styles.valueCell} style={{ minWidth: '200px', maxWidth: '200px' }}>
                    <CustomEditComponent
                      id={row.id}
                      field={tag.name}
                      value={row[tag.name]}
                      onValueChange={(newValue) => 
                        handleCellChange({ ...row, [tag.name]: newValue }, row, tag.name)
                      }
                      isOverwritten={row[`${tag.name}_isOverwritten`]}
                      baseValue={row[`${tag.name}_baseValue`]}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredAndSortedSecrets.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <div className={styles.bottomBar}>
        <div className={styles.versionWrapper}>
          <Button
            onClick={() => setVersionsOpen(true)}
            variant="outlined"
          >
            Versions
          </Button>
        </div>
        <div className={styles.actionsContainer}>
          <Button
            onClick={() => setDiffOpen(true)}
            disabled={updatedData.length === 0}
            color="primary"
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            disabled={updatedData.length === 0}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this secret key: <strong>{selectedRowId}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={deleteKey} color="secondary">
              Yes, Delete
            </Button>
            <Button onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Versions Dialog */}
      {versionsOpen && (
        <SecretVersions
          applicationName={applicationName}
          env={envName}
          tags={tags}
          secretsList={secretsList}
          versionsOpen={versionsOpen}
          setVersionsOpen={setVersionsOpen}
        />
      )}

      {/* Diff Dialog */}
      {diffOpen && (
        <Dialog open={diffOpen} onClose={() => setDiffOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Confirm Changes</DialogTitle>
          <DialogContent>
            <div className={styles.diffContainer}>
              {updatedData?.map((ele, index) => (
                <div key={index}>
                  <h3>{ele?.tag_name}</h3>
                  <SimpleDiffViewer
                    oldValue={originalData[index]?.secret_data?.secret}
                    leftTitle="Previous Version"
                    newValue={ele?.secret_data?.secret}
                    rightTitle="Current Version"
                  />
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSave} color="primary">
              Confirm Changes
            </Button>
            <Button onClick={() => setDiffOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default SecretsTable;