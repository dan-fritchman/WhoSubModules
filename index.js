require('dotenv').config()

const fs = require('fs');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });


const main = async () => {
  const resp = await octokit.graphql(
    `
    {
      search(query: "stars:>1000", type: REPOSITORY, first: 10) {
        repositoryCount
        pageInfo {
            endCursor
            hasNextPage
          }
        edges {
          cursor
          
          node {
            ... on Repository {
              name
              url
              descriptionHTML
              languages(first: 10) {
                totalSize
                nodes {
                  name
                }
              }
              stargazers {
                totalCount
              }
              forks {
                totalCount
              }
              updatedAt
              submodules(first: 100) {
                nodes {
                  name
                  path
                }
              }
            }
          }
        }
      }
    }
    
  `,
  );
  console.log(resp);
  fs.writeFile('repos.json', JSON.stringify(resp), function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
  });
}

main();
