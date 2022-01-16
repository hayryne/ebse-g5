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
            console.log(Object.keys(data[0]))

            this.items = data
        },
        showItem(item, index) {
            item.shown = !item.shown
            this.$set(this.items, index, item)
        }
    }
})