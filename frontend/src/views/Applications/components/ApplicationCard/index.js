import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import { Button } from 'components/Button';
import styles from './style.module.scss';

const ApplicationCard = ({ application, onClick }) => {
  const getApplicationType = () => {
    // You can customize this logic based on your application metadata
    return application.metadata?.type || 'Microservice';
  };

  const getCreatedBy = () => {
    // You can customize this logic based on your user system
    return application.metadata?.createdBy || 'System';
  };

  const getEnvironmentCount = () => {
    if (!application.environmentTagMappings || application.environmentTagMappings.length === 0) {
      return 0;
    }
    
    // Get unique environment IDs to count distinct environments
    const uniqueEnvironmentIds = new Set(
      application.environmentTagMappings.map(mapping => mapping.environment?.id).filter(Boolean)
    );
    
    return uniqueEnvironmentIds.size;
  };

  return (
    <Card className={styles.applicationCard} onClick={onClick}>
      <CardContent>
        <Typography variant="h6" component="h2" className={styles.applicationCard__title}>
          {application.name}
        </Typography>
        
        <div className={styles.applicationCard__details}>
          <Typography variant="body2" color="textSecondary">
            <strong>Organization:</strong> {application.organisation?.name}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>Type:</strong> {getApplicationType()}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>Created by:</strong> {getCreatedBy()}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            <strong>Environments:</strong> {getEnvironmentCount()}
          </Typography>
        </div>

        <div className={styles.applicationCard__chips}>
          <Chip 
            label={getApplicationType()} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={`${getEnvironmentCount()} envs`} 
            size="small" 
            color="secondary" 
            variant="outlined"
          />
        </div>
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={onClick}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default ApplicationCard;
