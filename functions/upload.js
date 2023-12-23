export async function onRequestPost(context) {
    const {   
        request,
        env,
        params,
        waitUntil,
        next,
        data,
    } = context;

    const url = new URL(request.url);

    // 检查路径是否为 admin、file 或者根路径
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/file') || url.pathname === '/') {
        // 如果是 admin、file 或者根路径，则执行请求转发
        const response = await fetch('https://telegra.ph' + url.pathname + url.search, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        });

        return response;
    } else {
        // 如果不是 admin、file 或者根路径，则返回 "你好"
        return new Response("你好", {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }
}
