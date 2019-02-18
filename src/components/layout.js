import React from "react";
import { css } from "@emotion/core";
import { StaticQuery, Link, graphql } from "gatsby";

import { rhythm } from "../utils/typography";

export default ({ children }) => (
  <StaticQuery
    query={graphql`
        query {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `}
    render={data => (
      <div
        css={css`
          margin: 0 auto;
          max-width: 700px;
          padding: ${rhythm(2)};
          padding-top: ${rhythm(1.5)};
        `}
      >
        <Link to={`/`}>
          <h3
            css={css`
              margin-bottom: ${rhythm(2)};
              display: inline-block;
              font-style: normal;
            `}
          >
            {data.site.siteMetadata.title}
          </h3>
        </Link>
        <Link
          to={`/about/`}
          css={css`
            float: right;
          `}
        >
          About
        </Link>
        {children}
        <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
           <img alt="Creative Commons License" style={{ borderWidth: 0}} src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" />
        </a>
      </div>
    )}
  />
);
