import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Alert } from '@material-ui/lab';
import { Button } from 'components/Button';
import Loader from 'components/Loader';
import { getApplications } from 'services/applications';
import EnvironmentCard from '../components/EnvironmentCard';
import AddEnvironmentDialog from '../components/AddEnvironmentDialog';
import styles from './style.module.scss';

const ApplicationDetails = () => {
  const { applicationName } = useParams();
  const history = useHistory();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddEnvironmentDialog, setShowAddEnvironmentDialog] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationName]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getApplications();
      
      if (!response.isError) {
        const apps = response.data || [];
        const foundApp = apps.find(app => app.name === applicationName);
        
        if (foundApp) {
          setApplication(foundApp);
        } else {
          setError('Application not found');
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnvironmentClick = (environment) => {
    history.push(`/applications/${applicationName}/environments/${environment.name}`);
  };

  const handleBackClick = () => {
    history.push('/applications');
  };

  const handleAddEnvironmentSuccess = () => {
    // Refresh the application details to show the newly added environment
    fetchApplicationDetails();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className={styles.applicationDetails}>
        <div className={styles.applicationDetails__header}>
          <Button onClick={handleBackClick} variant="outlined">
            ← Back to Applications
          </Button>
        </div>
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={styles.applicationDetails}>
        <div className={styles.applicationDetails__header}>
          <Button onClick={handleBackClick} variant="outlined">
            ← Back to Applications
          </Button>
        </div>
        <Alert severity="error">Application not found</Alert>
      </div>
    );
  }

  const environments = application.environmentTagMappings?.map(mapping => mapping.environment) || [];
  const uniqueEnvironments = environments.filter((env, index, self) => 
    index === self.findIndex(e => e.id === env.id)
  );

  return (
    <div className={styles.applicationDetails}>
      <div className={styles.applicationDetails__header}>
        <Button onClick={handleBackClick} variant="outlined">
          ← Back to Applications
        </Button>
        <h1>{application.name}</h1>
      </div>

      <div className={styles.applicationDetails__content}>
        <div className={styles.applicationDetails__info}>
          <div className={styles.applicationDetails__infoItem}>
            <strong>Organization:</strong> {application.organisation?.name}
          </div>
          <div className={styles.applicationDetails__infoItem}>
            <strong>Environments:</strong> {uniqueEnvironments.length}
          </div>
          <div className={styles.applicationDetails__infoItem}>
            <strong>Created At:</strong> {new Date(application.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className={styles.applicationDetails__environments}>
          <div className={styles.applicationDetails__environmentsHeader}>
            <h2>Environments</h2>
            <Button 
              onClick={() => setShowAddEnvironmentDialog(true)}
              variant="contained"
              color="primary"
              className={styles.applicationDetails__addButton}
            >
              + Add Environment
            </Button>
          </div>
          {uniqueEnvironments.length === 0 ? (
            <div className={styles.applicationDetails__empty}>
              <p>No environments attached to this application</p>
            </div>
          ) : (
            <div className={styles.applicationDetails__grid}>
              {uniqueEnvironments.map((environment) => (
                <EnvironmentCard
                  key={environment.id}
                  environment={environment}
                  applicationName={applicationName}
                  onClick={() => handleEnvironmentClick(environment)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEnvironmentDialog
        open={showAddEnvironmentDialog}
        onClose={() => setShowAddEnvironmentDialog(false)}
        applicationName={applicationName}
        organizationId={application?.organisation?.id}
        existingEnvironmentIds={uniqueEnvironments.map(env => env.id)}
        onSuccess={handleAddEnvironmentSuccess}
      />
    </div>
  );
};

export default ApplicationDetails;
