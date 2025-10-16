import React from "react";
import PropTypes from "prop-types";
import {
  ReactFinalForm,
  FormTextInput,
  FormFieldGroup,
  FormError,
} from "../../components/Form";
import { Button } from "../../components/Button";
// import GoogleLogin from "react-google-login";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import validate from "./validate";
import { GOOGLE_CLIENT_ID } from '../../config/constants'

// Styles
import styles from "./style.module.scss";

// Icons

import Logo from "../../assets/img/Launchpad_logo_2.png";


const Login = ({ loginPayload = {} }) => {
  const { error, message, onSubmitForm, onSubmitGoogle, onSubmitGoogleFailed } = loginPayload;


  return (
    <div className={styles["login"]}>
      <div className={styles["login__wrapper"]}>
        <div className={styles["login__branding"]}>

          <h2>Launchpad</h2>
          {/* <img src={Logo} alt="Launchpad Logo" /> */}

        </div>

        <div className={styles["login__form"]}>
          <ReactFinalForm
            onSubmit={onSubmitForm}
            validate={validate}
            initialValues={{}}
            render={({ values, errors, submitting }) => {
              return (
                <React.Fragment>
                  <FormFieldGroup>
                    <FormTextInput
                      name="email"
                      label="Email"
                      disabled={submitting}
                      required
                    />
                  </FormFieldGroup>

                  <FormFieldGroup>
                    <FormTextInput
                      name="password"
                      label="Password"
                      type="password"
                      disabled={submitting}
                      required
                    />
                  </FormFieldGroup>

                  <Button
                    type="submit"
                    disabled={submitting}
                    loading={submitting}
                    fullWidth
                  >
                    Sign In
                  </Button>

                  {/* <GoogleLogin
                    className={styles["login__google"]}
                    clientId="997700680400-or9qbs760i2kk1b0s7j5s625t7218of7.apps.googleusercontent.com"
                    onSuccess={onSubmitGoogle}
                    onFailure={onSubmitGoogleFailed}
                    cookiePolicy={"single_host_origin"}
                  /> */}
                  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <div className={styles["login__google"]}> {/* Tailwind example */}
                      <GoogleLogin
                        onSuccess={onSubmitGoogle}
                        onError={() => {}}
                      />
                    </div>
                  </GoogleOAuthProvider>
                </React.Fragment>
              );
            }}
          />

          {error && (
            <FormError
              show={error}
              message={message}
              className={styles["login__error"]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  loginPayload: PropTypes.shape({
    loading: PropTypes.bool,
    error: PropTypes.bool,
    message: PropTypes.string,
    onSubmitForm: PropTypes.func,
    onSubmitGoogle: PropTypes.func,
  }),
};

Login.defaultProps = {
  loginPayload: {
    loading: false,
    error: false,
    message: null,
    onSubmitForm: () => { },
    onSubmitGoogle: () => { },
  },
};

export default Login;
