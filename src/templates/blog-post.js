import React from "react";
import { graphql } from "gatsby";
import { Helmet } from "react-helmet";
import { css } from '@emotion/core';
import Layout from "../components/layout";

export default ({ data }) => {
  const post = data.markdownRemark;
  return (
    <Layout>
      <Helmet>
        <title>{post.frontmatter.title}</title>
      </Helmet>
      <article css={css`
        padding-top: 40px;
      `}>
        {post.frontmatter.banner && <img src={post.frontmatter.banner} alt="banner" /> }
        <h1>{post.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </Layout>
  );
};

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        banner
      }
    }
  }
`;
