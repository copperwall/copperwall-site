import React from "react";
import { Link } from "gatsby";
import { css } from "@emotion/core";
import { rhythm } from "../utils/typography";

export default ({ id, slug, title, date, excerpt }) => (
  <article key={id}>
    <Link to={slug}>
      <h3
        css={css`
          margin-bottom: ${rhythm(1 / 4)};
        `}
      >
        {title}
      </h3>
    </Link>
    <small
      css={css`
        color: #bbb;
      `}
    >
      {date}
    </small>
    <p>{excerpt}</p>
  </article>
);
