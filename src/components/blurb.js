import React from "react";
import PropTypes from "prop-types";
import { Link } from "gatsby";
import { css } from "@emotion/core";
import { rhythm } from "../utils/typography";

export default function Blurb({ id, slug, title, date, excerpt }) {
  return (
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
      {" "}
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
}

Blurb.propTypes = {
  id: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  excerpt: PropTypes.string.isRequired
}
