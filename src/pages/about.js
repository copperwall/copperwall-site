import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/layout";

export default function AboutMe({ data }) {
  return (
    <Layout>
      <h1>
        About
        {data.site.siteMetadata.title}
      </h1>
      <p>Super awesome cool blog on the internet</p>
    </Layout>
  );
}

AboutMe.propTypes = {
  data: PropTypes.objectOf({
    site: PropTypes.objectOf({
      siteMetadata: PropTypes.objectOf({
        title: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }).isRequired,
};

export const query = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
