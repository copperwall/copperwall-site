import React from "react";
import { Link } from 'gatsby'
import { css } from '@emotion/core'
import { rhythm } from '../utils/typography'

export default ({
  id,
  slug,
  title,
  date,
  excerpt
}) => (
    <div key={id}>
      <Link to={slug}>
        <h3
          css={css`
          margin-bottom: ${rhythm(1 / 4)};
        `}
        >
          {title}{" "}
          <span
            css={css`
            color: #bbb;
          `}
          >
            — {date}
          </span>
        </h3>
      </Link>
      <p>{excerpt}</p>
    </div>
  );
