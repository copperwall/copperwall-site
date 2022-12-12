import React from "react";
import PropTypes from "prop-types";
import { css } from "@emotion/core";

import Header from "./header";
import { rhythm } from "../utils/typography";

export default function Layout({
  children,
  maxWidth = rhythm(35),
  mobilePadding = rhythm(2),
}) {
  return (
    <div
      css={css`
        margin-left: auto;
        margin-right: auto;
        max-width: ${maxWidth};
        padding: ${rhythm(2)};
        padding-top: ${rhythm(1.5)};
        line-height: ${rhythm(1.2)};

        @media only screen and (min-device-width: 320px) and (max-device-width: 480px) and (-webkit-min-device-pixel-ratio: 2) {
          padding: ${mobilePadding};
          padding-top: ${rhythm(1.5)};
        }
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
        <a rel="me" href="https://hachyderm.io/@copperwall">
          Mastodon
        </a>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
