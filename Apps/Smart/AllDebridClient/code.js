class AllDebridClient
{
    getStatusPath(args) {
        let path = args.properties?.statusPath || '/api/integrations/fenrus/status';
        if (!path)
            path = '/api/integrations/fenrus/status';
        if (path.startsWith('/') === false)
            path = '/' + path;
        return path;
    }

    fetchStatus(args) {
        let url = args.url;
        if (url.endsWith('/'))
            url = url.substring(0, url.length - 1);
        let result = args.fetch({
            url: url + this.getStatusPath(args),
            timeout: 10
        });

        if (!result.success)
            throw result.content || 'Fetch failed';

        return result.data;
    }

    status(args) {
        let data = this.fetchStatus(args);
        let metrics = data?.metrics;
        let state = data?.state;
        if (!metrics || !state)
            throw 'No data returned';

        if (state.level === 'warning' || state.level === 'error')
            args.setStatusIndicator('Update');
        else
            args.setStatusIndicator('');

        let stats = [
            ['State', state.message || state.level || 'Unknown'],
            ['Active', metrics.active_downloads ?? 0],
            ['Queued', metrics.queued_downloads ?? 0],
            ['Done', metrics.completed_count ?? 0]
        ];

        if (args.size === 'large' || args.size === 'larger' || args.size === 'x-large' || args.size === 'xx-large') {
            stats.push(['Errors', metrics.error_count ?? 0]);
            stats.push(['24h', metrics.completed_last_24h ?? 0]);
        }

        return args.liveStats(stats);
    }

    test(args) {
        let data = this.fetchStatus(args);
        return data?.display_name === 'AllDebrid-Client' || data?.service === 'alldebrid-client';
    }
}
