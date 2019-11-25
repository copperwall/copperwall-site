import React from "react";
import { graphql } from "gatsby";
import SEO from '../components/seo';
import { css } from '@emotion/core';
import Layout from "../components/layout";

export default ({ data }) => {
  const post = data.markdownRemark;
  return (
    <Layout>
      <SEO title={post.frontmatter.title} />
      <article css={css`
        padding-top: 40px;
      `}>
        <div>
          {post.frontmatter.banner && <img src={post.frontmatter.banner} alt="banner" /> }
          {post.frontmatter.bannerCredit && <p style={{textAlign: 'center'}}>{post.frontmatter.bannerCredit}</p> }
        </div>
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
        bannerCredit
      }
    }
  }
`;
