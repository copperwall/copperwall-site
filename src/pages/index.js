import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import Blurb from '../components/blurb'

export default ({ data }) => (
  <Layout>
    <h4>{data.allMarkdownRemark.totalCount} Posts</h4>
    {data.allMarkdownRemark.edges.map(({ node }) => (
      <Blurb key={node.id}
             slug={node.fields.slug}
             title={node.frontmatter.title}
             date={node.frontmatter.date}
             excerpt={node.excerpt} />
    ))}
  </Layout>
);

export const query = graphql`
  query {
    allMarkdownRemark(sort: { fields: frontmatter___date, order: DESC }) {
      totalCount
      edges {
        node {
          fields {
            slug
          }
          id
          frontmatter {
            title
            date(formatString: "DD MMMM, YYYY")
          }
          excerpt
        }
      }
    }
  }
`;
