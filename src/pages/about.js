import React from "react";
import { css } from "@emotion/core";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Helmet from "react-helmet";
import Layout from "../components/layout";

function HeartIcon() {
  return <i className="nes-icon heart" />;
}

function Header() {
  return (
    <section
      css={css`
        margin-top: 2rem;
        margin-bottom: 2rem;
      `}
    >
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        `}
      >
        <h1>Chris Opperwall</h1>
        <span
          css={css`
            max-width: 26rem;
          `}
        >
          {Array(getHeartPoints()).fill(<HeartIcon />)}
        </span>
      </div>
      <div
        css={css`
          display: flex;
          max-width: 25rem;
          justify-content: space-between;
        `}
      >
        <h2>@copperwall</h2>{" "}
        <span>
          <a href="https://github.com/copperwall">
            <i className="nes-icon github" />
          </a>{" "}
          <a href="https://twitter.com/copperwall">
            <i className="nes-icon twitter" />
          </a>
        </span>
      </div>
    </section>
  );
}

function Container({ children }) {
  return (
    <section
      css={css`
        h3 {
          margin-bottom: 2rem;
        }

        @media only screen and (min-device-width: 320px) and (max-device-width: 480px) and (-webkit-min-device-pixel-ratio: 2) {
          .nes-container {
            width: 100vw;
            margin-left: calc(-50vw + 50%);
          }
        }

        margin-bottom: 2rem;
      `}
      className="nes-container"
    >
      {children}
    </section>
  );
}

function getHeartPoints() {
  return new Date().getFullYear() - 1993;
}

export default function AboutMe({ data }) {
  const {
    github: {
      viewer: { repositories, repositoriesContributedTo },
    },
  } = data;
  return (
    <Layout maxWidth={"unset"} mobilePadding="0">
      <Helmet
        style={[
          {
            cssText: `
              h1,h2,h3,h4,h5,h6,p {
                font-family: "Press Start 2P"
              }
        `,
          },
        ]}
      >
        <link
          href="https://unpkg.com/nes.css@2.3.0/css/nes.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Press+Start+2P"
          rel="stylesheet"
        />
      </Helmet>
      <Container>
        <Header />

        <Container>
          <h3>A little about me</h3>
          <p>
            I&apos;m originally from the East Bay Area, but I lived in San Luis
            Obispo while attending school and working full-time afterwards. I
            moved back to the bay area in 2018.
          </p>
          <p>
            I care a lot about open-source and using software for good. In my
            free time I&apos;m usually looking for issues to pick up on
            open-source projects that I like. One of my prouder moments was
            helping to stand up a service that let constituents call their
            representatives about{" "}
            <a href="https://california.repair.org/">
              Right to Repair legislation
            </a>
            .
          </p>
          <p>
            I spent most of my time around JavaScript, but I like learning
            things in general. I&apos;ve been learning some languages like go
            and elixir on the side, and I&apos;ve been trying to bake sourdough
            for a little (like every other person on the planet, I know).
          </p>
        </Container>
        <Container>
          <h3>Repositories I&apos;ve Been Working On Recently</h3>
          {repositories.nodes.map((repo) => {
            return (
              <a href={repo.url} key={repo.id}>
                <p>
                  {repo.nameWithOwner}{" "}
                  <span>
                    ({repo.stargazers.totalCount} stars, {repo.forks.totalCount}{" "}
                    forks)
                  </span>
                </p>
              </a>
            );
          })}
        </Container>

        <Container>
          <h3>Repositories I Contribute To</h3>
          {repositoriesContributedTo.nodes.map((repo) => {
            return (
              <a href={repo.url} key={repo.id}>
                <p>
                  {repo.nameWithOwner}{" "}
                  <span>
                    ({repo.stargazers.totalCount} stars, {repo.forks.totalCount}{" "}
                    forks)
                  </span>
                </p>
              </a>
            );
          })}
        </Container>
      </Container>
    </Layout>
  );
}

AboutMe.propTypes = {
  data: PropTypes.objectOf({
    site: PropTypes.objectOf({
      siteMetadata: PropTypes.objectOf({
        title: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export const query = graphql`
  fragment RepoInfo on GitHub_RepositoryConnection {
    nodes {
      nameWithOwner
      stargazers {
        totalCount
      }
      forks {
        totalCount
      }
      url
    }
  }

  query AboutMe {
    site {
      siteMetadata {
        title
      }
    }

    github {
      viewer {
        repositoriesContributedTo(
          orderBy: { field: STARGAZERS, direction: DESC }
          first: 20
          privacy: PUBLIC
        ) {
          ...RepoInfo
        }
        repositories(
          orderBy: { field: UPDATED_AT, direction: DESC }
          first: 10
          privacy: PUBLIC
        ) {
          ...RepoInfo
        }
      }
    }
  }
`;
