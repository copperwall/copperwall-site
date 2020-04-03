const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

// TODO: What does onCreateNode actually do?
// Is it a global function that gets called whenever a GraphQL node gets created?
// And then we check the internal type and create a new field on the node with a name and
// value?
// What does createFilePath do?
// It takes a GraphQL node, a function for getting a node(?) and a basepath
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === "MarkdownRemark") {
    const slug = createFilePath({
      node,
      getNode,
      basePath: `pages/posts`,
      trailingSlash: false
    });
    createNodeField({
      node,
      name: "slug",
      value: slug
    });
  }
};

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;
  return graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `).then(result => {
    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: path.resolve(`./src/templates/blog-post.js`),
        context: {
          slug: node.fields.slug
        }
      });
    });
  });
};
