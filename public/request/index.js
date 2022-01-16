new Vue({
    el: '#app',
    data() {
        return {
            data: {},
            tables: {}
        }
    },
    created() {
        this.getTables()
        
        const lastRequest = localStorage.getItem('last-request')
        console.log('got last request', lastRequest);
        if (lastRequest)
            document.querySelector('#request').innerHTML = lastRequest
    },
    methods: {
        async getTables() {
            const res = await fetch('/tables', {})
            const res_tables = await res.json()
            const tables = {}

            // formatting
            for (const tablename in res_tables)
                tables[tablename] = res_tables[tablename].join('\n')

            this.tables = tables
        },
        async sendRequest() {
            const request = document.querySelector('#request').value
            this.$set(this.data, 'loading', true)

            localStorage.setItem('last-request', request)

            const res = await fetch(`/request`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ request })
            })
            const data = await res.json()

            this.$set(this.data, 'body', data)
            this.$set(this.data, 'loading', false)
        },
        async saveData() {
            const filePath = document.querySelector("#saveAs").value

            fetch(`/save`, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filePath })
            })
        }   
    }
})