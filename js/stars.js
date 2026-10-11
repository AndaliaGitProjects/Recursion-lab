/* Vercel serverless function: has this GitHub user starred the repo?
   GET /api/check-star?user=<github-username>  ->  { "starred": true | false }

   Optional: add a GITHUB_TOKEN environment variable in Vercel (a fine-grained
   token with read-only access to public repositories is enough). It raises
   GitHub's limit from 60 to 5000 requests/hour and is never sent to visitors. */

const REPO = "AndaliaGitProjects/Recursion-lab"
const NAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  const user = String((req.query && req.query.user) || "")
    .trim()
    .replace(/^@/, "")
  if (!NAME.test(user)) return res.status(400).json({ error: "bad_user" })

  const headers = {
    "User-Agent": "recursion-lab-star-check",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN

  const want = user.toLowerCase()
  try {
    for (let page = 1; page <= 30; page++) {
      const url = `https://api.github.com/repos/${REPO}/stargazers?per_page=100&page=${page}`
      let r = await fetch(url, { headers })
      if (r.status === 401 && headers.Authorization) {
        /* bad/expired server token: carry on without it */
        delete headers.Authorization
        r = await fetch(url, { headers })
      }
      if (r.status === 403 || r.status === 429)
        return res.status(429).json({ error: "rate" })
      if (!r.ok)
        return res.status(502).json({ error: "github", status: r.status })
      const list = await r.json()
      if (list.some((u) => u.login.toLowerCase() === want))
        return res.status(200).json({ starred: true })
      if (list.length < 100) break
    }
    return res.status(200).json({ starred: false })
  } catch (e) {
    return res.status(502).json({ error: "github" })
  }
}
