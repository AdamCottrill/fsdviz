class MultipleProxyMiddleware:
    """From Django docs. The get_host() method fails when the
    host is behind multiple proxies. One solution is to use
    middleware to rewrite the proxy headers"""

    FORWARDED_FOR_FIELDS = [
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED_HOST",
        "HTTP_X_FORWARDED_SERVER",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        """
        Rewrites the proxy headers so that only the most
        recent proxy is used.
        """
        for field in self.FORWARDED_FOR_FIELDS:
            if field in request.META:
                if "," in request.META[field]:
                    parts = request.META[field].split(",")
                    request.META[field] = parts[-1].strip()
        return self.get_response(request)
