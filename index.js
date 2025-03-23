var axios = require("axios")
var cheerio = require("cheerio")
var fs = require("fs")
var path = require("path")

// user input   
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

readline.question('请输入 GitHub 用户名：', (username) => {
    url = `https://github.com/${username}?tab=repositories`
    readline.close()
    // 从 GitHub 获取仓库列表
    getRepoList(url)
})

function getRepoList(url) {

    axios.get(url)
        .then(resp => {
            try {
                var $ = cheerio.load(resp.data)
                var lis = $("#user-repositories-list li")
                if (lis.length === 0) {
                    throw new Error("未找到仓库列表，页面结构可能已改变")
                }
                var repos = []
                for (var i = 0; i < lis.length; i++) {
                    var li = lis.eq(i)
                    // 提取数字的辅助函数
                    const extractNumber = text => {
                        const match = text.match(/\d+/);
                        return match ? parseInt(match[0]) : 0;
                    }

                    var repo = {
                        repoName: li.find("h3").text().trim(),
                        repoUrl: li.find("h3 a").attr("href").trim(),
                        repoDesc: li.find("p").text().trim(),
                        language: li.find("[itemprop=programmingLanguage]").text().trim(),
                        star: extractNumber(li.find("a.Link--muted[href$='/stargazers']").text()),
                        fork: extractNumber(li.find("a.Link--muted[href$='/network/members']").text()),
                        forkedFrom: li.find(".f6.text-gray.mb-1 a").text().trim()
                    }
                    repos.push(repo)
                }
                try {
                    fs.writeFileSync(path.join(__dirname, "repos.json"), JSON.stringify(repos, null, 4))
                    // 输出一些基本统计信息
                    console.log("统计信息：")
                    console.log(`总仓库数：${repos.length}`)
                    console.log(`总 Star 数：${repos.reduce((sum, repo) => sum + repo.star, 0)}`)
                    console.log(`总 Fork 数：${repos.reduce((sum, repo) => sum + repo.fork, 0)}`)
                    console.log("数据已保存到 repos.json")
                    console.log("运行 npm run display 启动服务器，然后在浏览器中查看可视化分析结果")
                } catch (writeErr) {
                    console.error("写入文件时出错：", writeErr.message)
                }
            } catch (parseErr) {
                console.error("解析数据时出错：", parseErr.message)
            }
        })
        .catch(err => {
            console.error("请求失败：", err.message)
            if (err.response) {
                console.error("状态码：", err.response.status)
            }
        })
}