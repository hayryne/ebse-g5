new Vue({
    el: '#app',
    data() {
        return {
            repositories: {}
        }
    },
    created() {
        this.getRepositories()
    },
    methods: {
        async getRepositories() {
            const res = await fetch('/repositories', {})
            const data = await res.json()

            const repositories = {}
        
            data.forEach(repoId => repositories[repoId] = {})

            this.repositories = repositories
        },
        async openRepository(repoId) {
            const res = await fetch(`/commits/${repoId}`)
            const data = await res.json()
        
            this.$set(this.repositories[repoId], 'commits', data)
        }
    }
})