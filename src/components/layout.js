import React from "react";
import { css } from "@emotion/core";

import Header from "../components/header";
import { rhythm } from "../utils/typography";

export default ({ children }) => (
  <div
    css={css`
      margin-left: auto;
      margin-right: auto;
      max-width: ${rhythm(30)};
      padding: ${rhythm(2)};
      padding-top: ${rhythm(1.5)};
      line-height: ${rhythm(1.2)}
    `}
  >
    <Header />
    <div>
      {children}
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
