new Vue({
    el: '#app',
    data() {
        return {
            data: []
        }
    },
    created() {
        this.getData()
    },
    methods: {
        async getData() {
            const res = await fetch('/data', {})
            const data = await res.json()
        
            this.data = data
        }
    }
})