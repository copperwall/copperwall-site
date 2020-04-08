import React from "react";
import PropTypes from 'prop-types'
import { css } from "@emotion/core";

import Header from "./header";
import { rhythm } from "../utils/typography";

export default function Layout({ children }) {
  return (
    <div
      css={css`
        margin-left: auto;
        margin-right: auto;
        max-width: ${rhythm(30)};
        padding: ${rhythm(2)};
        padding-top: ${rhythm(1.5)};
        line-height: ${rhythm(1.2)};
      `}
    >
      <Header />
      <div>
        <main>{children}</main>
        <hr />
        <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
          <img
            alt="Creative Commons License"
            style={{ borderWidth: 0 }}
            src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png"
          />
        </a>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
}
