import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import CloudIcon from '@material-ui/icons/Cloud';
import { Button } from 'components/Button';
import styles from './style.module.scss';

const EnvironmentCard = ({ environment, applicationName, onClick }) => {
  const getCloudProvider = () => {
    return environment.cloudAccount?.provider || 'Unknown';
  };

  const getCloudAccountName = () => {
    return environment.cloudAccount?.account_name || environment?.cloud_account_id || 'Unknown';
  };

  const getVpcId = () => {
    return environment.vpc_id || 'Not set';
  };

  return (
    <Card className={styles.environmentCard} onClick={onClick}>
      <CardContent>
        <Typography variant="h6" component="h3" className={styles.environmentCard__title}>
          {environment.name}
        </Typography>
        
        <div className={styles.environmentCard__details}>
          <Typography variant="body2" color="textSecondary">
            <strong>Cloud Provider:</strong> {getCloudProvider()}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>Account:</strong> {getCloudAccountName()}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>VPC ID:</strong> {getVpcId()}
          </Typography>
        </div>

        <div className={styles.environmentCard__chips}>
          <Chip 
            icon={<CloudIcon />}
            label={getCloudProvider().toUpperCase()} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label="Secrets" 
            size="small" 
            color="secondary" 
            variant="outlined"
          />
        </div>
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={onClick}>
          View Secrets
        </Button>
      </CardActions>
    </Card>
  );
};

export default EnvironmentCard;

