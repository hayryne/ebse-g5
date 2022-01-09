new Vue({
    el: '#app',
    data() {
        return {
            entries: {}
        }
    },
    created() {
        this.getEntries()
    },
    methods: {
        async getEntries() {
            const res = await fetch('/entries', {})
            const data = await res.json()

            const entries = {}
        
            data.forEach(entryId => entries[entryId] = {})

            this.entries = entries
        },
        async openEntry(entryId) {
            const res = await fetch(`/entry/${entryId}`)
            const data = await res.json()
        
            this.$set(this.entries[entryId], 'data', data)
        }
    }
})