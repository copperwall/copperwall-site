import React from "react";
import PropTypes from "prop-types";
import Helmet from "react-helmet";
import { graphql, useStaticQuery } from "gatsby";

export default function SEO({ description = "", lang = "en", title = "" }) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            rootUrl
            title
            description
            author
          }
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;
  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      defaultTitle={site.siteMetadata.title}
      meta={[
        {
          name: "description",
          content: metaDescription,
        },
        {
          property: "og:title",
          content: title || site.siteMetadata.title,
        },
        {
          property: "og:title",
          content: title || site.siteMetadata.title,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary",
        },
        {
          name: "twitter:creator",
          content: site.siteMetadata.author,
        },
        {
          name: "twitter:title",
          content: title || site.siteMetadata.title,
        },
        {
          name: "twitter:description",
          content: metaDescription,
        },
      ]}
    />
  );
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  title: PropTypes.string,
};
