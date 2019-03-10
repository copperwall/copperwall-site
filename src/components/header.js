import React from "react";
import { css } from "@emotion/core";
import { StaticQuery, Link, graphql } from "gatsby";

export default () => (
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
      <header
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <Link to={`/`}>
          <h3>{data.site.siteMetadata.title}</h3>
        </Link>
        <Link to={`/about/`}>About</Link>
      </header>
    )}
  />
);
