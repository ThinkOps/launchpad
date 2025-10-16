import React from 'react';
import { IconButton } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import styles from './style.module.scss';

const CopyToClipboard = ({ textToCopy, label, field }) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      // You could add a toast notification here if available
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <IconButton 
      size="small" 
      onClick={copyToClipboard}
      className={styles.copyButton}
      title={`Copy ${field} value`}
    >
      <FileCopyIcon fontSize="small" />
    </IconButton>
  );
};

export default CopyToClipboard;
