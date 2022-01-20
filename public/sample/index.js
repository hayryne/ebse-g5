new Vue({
    el: '#app',
    data() {
        return {
            keys: [
                'git_comments',
                'git_commits',
                'github_issues',
                'github_issues_comments',
                'github_pulls',
                'github_pulls_comments',
                'github_pulls_reviews',
                'jira_issues',
                'jira_issues_comments'
            ],
            items: []
        }
    },
    created() {
        this.getData()
    },
    methods: {
        async getData() {
            const res = await fetch('/sampleData')
            const data = await res.json()

            data.forEach(item => item.shown = true)

            this.items = data
        },
        showItem(item, index) {
            item.shown = !item.shown
            this.$set(this.items, index, item)
        },
        print() {
            for (let i = 1; i <= this.items.length; i++) {
                const content = document.getElementById(i).innerHTML

                const html = `<!DOCTYPE html><html>${content}</html>`
                const blob = new Blob([html], { type: "text/html;charset=utf-8" })

                saveAs(blob, `item_${i}.html`)
            }
        }
    }
})