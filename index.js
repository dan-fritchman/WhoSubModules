// 
// # WhoSubModules 
// ## Data Retrieval 
// 
// Retrieve GitHub's top repositories (by star-count), 
// and save a bunch of facts about them, notably including their sub-module count. 
// 
// Note the GitHub GraphQL API *can* provide the submodule names and URLs, 
// but experience has shown many of them generate errors, 
// particularly those including uncommon characters. 
// 
// Also note that the GitHub search API limits results to 1000 entries, 
// even after applying pagination. 
// Our queries will indicate they find many more repositories in their `repositoryCount` field, 
// but retrieving more than 1000 has thus far escaped our grasp. 
// 

require('dotenv').config()
const fs = require('fs');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

const getpage = (cursor) => {
  // Get a single page of repository results, starting from `cursor`. 
  // Defaults to the beginning-of-search if cursor is undefined. 

  const after = cursor ? `, after: "${cursor}"` : '';

  return octokit.graphql(
    `{
      search(query: "stars:>1000 sort:stars", type: REPOSITORY, first: 50 ${after}) {
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
              submodules {
                totalCount
              }
            }
          }
        }
      }
    }`);
}

const main = async () => {
  // Main method. Iterate over pages of Repositories.

  let more = true;
  let cursor = null;
  let k = 0;

  while (more) {
    // Pagination Loop 
    // Get a page-worth of repositories

    let got_em = false;
    while (!got_em) {
      // Error/ Retry Loop 

      try {
        resp = await getpage(cursor);
        repos = resp.search.edges;
        const nrepos = resp.search.repositoryCount;
        got_em = true;
        console.log(`Got Page #${k} of ${nrepos} Repositories`);
      } catch (error) {
        // Our most common case of errors will be API rate-limiting. 
        // That's fine, we're in no hurry here. Just wait a while and try again. 
        console.log(`Error Getting Page #${k}`);
        console.log(error);
        await sleep(10_000);
        console.log(`Retrying Page #${k}`);
      }
    }

    // Write the repository data to disk 
    const fname = `repos/repos.${k}.json`;
    fs.writeFile(fname, JSON.stringify(repos), function (err) {
      if (err) return console.log(err);
      console.log(`Wrote Page #${k} to ${fname}`);
    });
    
    // Check whether we have any more repos 
    more = resp.search.pageInfo.hasNextPage;
    cursor = resp.search.pageInfo.endCursor;
    k += 1;
  }
  console.log(resp);
  console.log(`Wrote ${k} Repo Data Files to repos/`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main();
