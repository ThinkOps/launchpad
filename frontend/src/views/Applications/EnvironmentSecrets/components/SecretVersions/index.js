import React, { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer";
import classNames from "classnames";
import Box from "@material-ui/core/Box";
import Modal from "@material-ui/core/Modal";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import InfoIcon from "@material-ui/icons/Info";
import ContentCopyIcon from "@material-ui/icons/FileCopy";
import styles from "./style.module.scss";
import { Pagination } from "@material-ui/lab";
import {
  getVersionOfApplicationSecret,
  revertApplicationSecret,
} from "services/applications";
import { Button } from "components/Button";
import dateTimeUtils from "utils/dateTime";

const modalStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxHeight: "80%",
  bgcolor: "#ffffff",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

const metadataModalStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "50%",
  maxHeight: "80%",
  bgcolor: "#ffffff",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

const diffStyles = {
  variables: {
    diffRemoved: {
      overflowX: "auto",
      maxWidth: 300,
    },
    diffAdded: {
      overflowX: "auto",
      maxWidth: 300,
    },
  },
  line: {
    wordBreak: "break-word",
  },
};

const SecretVersions = ({
  applicationName,
  env: envName,
  tags,
  secretsList,
  versionsOpen,
  setVersionsOpen,
}) => {
  const [tag, setTag] = useState();
  const [secret, setSecret] = useState();
  const [versionId, setVersionId] = useState();
  const [versionsList, setVersionsList] = useState([]);
  const [versionSecret, setVersionSecret] = useState();
  const [metadata, setMetadata] = useState([]);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [name, setName] = useState("");

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVersions = versionsList.slice(startIndex, endIndex);

  const getMetadataForVersion = (version_id) => {
    if (!metadata || !Array.isArray(metadata)) {
      return {};
    }
    const meta = metadata.filter((m) => m.version === version_id);
    return meta?.[0] || {};
  };

  useEffect(() => {
    if (secret) {
      getVersions();
    }
    if (versionId) {
      getVersionDetails();
    }
  }, [tag, secret, versionId]);

  const copyToClipBoard = (copiedString) => {
    navigator.clipboard.writeText(copiedString);
    alert("Version Id copied to clipboard");
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

  const getVersions = async () => {
    const tag_name = secret.tag_name;
    const response = await getVersionOfApplicationSecret(
      applicationName,
      envName,
      tag_name,
    );
    if (response?.data?.versions?.length > 0) {
      setVersionsList(response?.data?.versions);
      const sortedMetadata = [...response?.data?.metadata].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  
      setMetadata(sortedMetadata);
      setName(response?.data?.name)
    }
  };

  const getVersionDetails = async () => {
    const tag_name = secret.tag_name;
    const version_id = versionId;
    
    try {
      const response = await getVersionOfApplicationSecret(
        applicationName,
        envName,
        tag_name,
        version_id
      );
      
      if (response?.data?.secret) {
        setVersionSecret(response?.data?.secret);
      } else {
        setVersionSecret(null);
      }
    } catch (error) {
      console.error('Error getting version details:', error);
      setVersionSecret(null);
    }
  };

  const revertToVersion = async () => {
    const data = {
      tag_name: secret.tag_name,
      current_version_id: secret?.secret_data?.current_version_id,
      revert_to_version_id: versionId,
    };
    try {
      const response = await revertApplicationSecret(applicationName, envName, data);
      if (response.error) {
        alert(response.message);
      } else {
        alert('Secret Reverted 👌');
        window.location.reload();
      }
    } catch (error) {
      alert('Error reverting secret: ' + error.message);
    }
  };

  return (
    <>
      <Modal
        open={versionsOpen}
        onClose={(e) => {
          setVersionsOpen(false);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <div className={styles["secret__version__details"]}>
            <div className={styles["secret__version__title__section"]}>
              <h2>Secret Versions</h2>
              {secret && (
                <InfoIcon
                  className={styles["info__icon"]}
                  onClick={(e) => {
                    setMetadataOpen(true);
                  }}
                />
              )}
            </div>
            <div className={styles["selection__container"]}>
              <Select
                onChange={(e) => {
                  setSecret(e?.target?.value);
                }}
                defaultValue={0}
                className={classNames(
                  styles["select__tag"],
                  styles["select__input"]
                )}
              >
                <MenuItem className={styles["version__menuItem"]} disabled value={0}>
                  {"Select Tag"}
                </MenuItem>

                {secretsList?.map((ele, index) => {
                  return (
                    <MenuItem key={index} value={ele}>
                      {ele.tag_name}
                    </MenuItem>
                  );
                })}
              </Select>
              <Select
                onChange={(e) => {
                  setVersionId(e?.target?.value);
                }}
                defaultValue={0}
                className={classNames(
                  styles["select__version"],
                  styles["select__input"]
                )}
                disabled={!secret}
                placeholder="Select Version"
              >
                <MenuItem
                  className={styles["version__menu__item"]}
                  disabled
                  value={0}
                >
                  {"Select Version"}
                </MenuItem>

                {paginatedVersions?.map((ele, index) => {
                  return (
                    <MenuItem
                      className={styles["version__menu__item"]}
                      key={index}
                      value={ele.version_id}
                      disabled={ele?.version_stage === "CURRENT"}
                    >
                      <span className={styles["version__details"]}>
                        <span className={styles["version__name"]} >{ele.version_stage}</span>
                        <span className={styles["version__timestamp"]}>{dateTimeUtils.get12HoursFormattedDate(ele.created_at)}</span>
                      </span>
                      <span className={styles["version__id"]}>
                        {ele.version_id}
                        <span className={styles["version__id__name"]}> - {getMetadataForVersion(ele.version_id)?.metadata?.name}</span>
                      </span>
                    </MenuItem>
                  );
                })}
                <Pagination
                className={styles["pagination"]}
                  count={Math.ceil(versionsList.length / itemsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Select>
            </div>
            {versionId && secret && (
              <div className={styles["version__diff__wrapper"]}>
                <h3>Version Comparison</h3>
                {versionSecret ? (
                  <ReactDiffViewer
                    oldValue={formatString(JSON.stringify(versionSecret.secret || versionSecret))}
                    leftTitle={`Version: ${versionId}`}
                    newValue={formatString(
                      JSON.stringify(secret?.secret_data?.secret)
                    )}
                    rightTitle={`Version: ${secret?.secret_data?.current_version_id}  (Current)`}
                    styles={diffStyles}
                  />
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p>Loading version details...</p>
                    <p>If this takes too long, there might be an issue with the API call.</p>
                  </div>
                )}
                
                {/* Fallback simple diff - always show when version is selected */}
                {/* <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                  <h4>Simple Fallback Diff:</h4>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px' }}>
                      <h5>Version: {versionId}</h5>
                      <pre style={{ background: '#fff5f5', padding: '10px', fontSize: '12px' }}>
                        {versionSecret ? JSON.stringify(versionSecret.secret || versionSecret, null, 2) : 'Loading...'}
                      </pre>
                    </div>
                    <div style={{ flex: 1, border: '1px solid #ddd', padding: '10px' }}>
                      <h5>Current Version</h5>
                      <pre style={{ background: '#f0fff4', padding: '10px', fontSize: '12px' }}>
                        {JSON.stringify(secret?.secret_data?.secret, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div> */}
              </div>
            )}
            
            {/* Debug information */}
            {/* <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
              <h4>Debug Info:</h4>
              <p>Secret selected: {secret?.tag_name || 'None'}</p>
              <p>Version ID: {versionId || 'None'}</p>
              <p>Version Secret exists: {versionSecret ? 'Yes' : 'No'}</p>
              <p>Current Secret exists: {secret?.secret_data?.secret ? 'Yes' : 'No'}</p>
              {versionSecret && (
                <details>
                  <summary>Version Secret Data</summary>
                  <pre>{JSON.stringify(versionSecret, null, 2)}</pre>
                </details>
              )}
              {secret?.secret_data?.secret && (
                <details>
                  <summary>Current Secret Data</summary>
                  <pre>{JSON.stringify(secret?.secret_data?.secret, null, 2)}</pre>
                </details>
              )}
            </div> */}
          </div>
          <div className={styles["actions__container"]}>
            {versionId && (
              <Button
                className={styles["form__action"]}
                onClick={(e) => {
                  revertToVersion();
                }}
              >
                {`Revert to Version: ${versionId}`}
              </Button>
            )}
            <Button
              className={styles["form__action"]}
              variant="outlined"
              onClick={(e) => {
                setVersionsOpen(false);
              }}
            >
              CANCEL
            </Button>
          </div>
        </Box>
      </Modal>
      <Modal
        open={metadataOpen}
        onClose={(e) => {
          setMetadataOpen(false);
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={metadataModalStyle}>
          <div className={styles["metadata__modal"]}>
            <h2>History - {name}</h2>
            <div className={styles["metadata__list"]}>
              {metadata && Array.isArray(metadata) && metadata?.map((ele, index) => {
                const date = ele?.created_at;
                return (
                  <>
                    <div
                      key={index}
                      className={styles["version__update__container"]}
                    >
                      <h3>Operation: {ele?.operation}</h3>
                      <span className={styles["version__id__container"]}>
                        From version:
                        <span
                          className={styles["version__id__copy"]}
                          onClick={() => {
                            copyToClipBoard(ele?.from_version);
                          }}
                        >
                          {ele?.from_version}
                        </span>
                        <ContentCopyIcon
                          className={styles["copy__icon"]}
                          onClick={() => {
                            copyToClipBoard(ele?.from_version);
                          }}
                        />
                      </span>
                      {ele?.operation === "REVERT" && (
                        <span className={styles["version__id__container"]}>
                          Reverted to version:
                          <span
                            className={styles["version__id__copy"]}
                            onClick={() => {
                              copyToClipBoard(ele?.metadata?.revertedToVersion);
                            }}
                          >
                            {ele?.metadata?.revertedToVersion}
                          </span>
                          <ContentCopyIcon
                            className={styles["copy__icon"]}
                            onClick={() => {
                              copyToClipBoard(ele?.metadata?.revertedToVersion);
                            }}
                          />
                        </span>
                      )}
                      <span className={styles["version__id__container"]}>
                        New version:
                        <span
                          className={styles["version__id__copy"]}
                          onClick={() => {
                            copyToClipBoard(ele?.version);
                          }}
                        >
                          {ele?.version}
                        </span>
                        <ContentCopyIcon
                          className={styles["copy__icon"]}
                          onClick={() => {
                            copyToClipBoard(ele?.version);
                          }}
                        />
                      </span>
                      <span>Date and Time: {new Date(date).toString()}</span>
                      <span>Updated by: {ele?.metadata?.name}</span>
                    </div>
                  </>
                );
              })}
            </div>
          </div>
          <div className={styles["actions__container"]}>
            <Button
              className={styles["form__action"]}
              variant="outlined"
              onClick={(e) => {
                setMetadataOpen(false);
              }}
            >
              CLOSE
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default SecretVersions;
