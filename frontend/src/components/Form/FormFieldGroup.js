import PropTypes from "prop-types";
import classNames from "classnames";

import style from "./style.module.scss";

export const FormFieldGroup = ({ children, columnType, grid, ...props }) => {

  const FormFieldGroupClass = classNames({
    [style["form__group"]]: true,
    [style["form__group__one"]]: columnType === "one",
    [style["form__group__two"]]: columnType === "two",
    [style["form__group__three"]]: columnType === "three",
    [style["form__group__full"]]: columnType === "full",
    [style["grid__container"]]: grid,
  });

  return <div className={FormFieldGroupClass}>{children}</div>;
};

FormFieldGroup.propTypes = {};
