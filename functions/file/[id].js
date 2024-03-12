export async function onRequest(context) {  
    const {   
        request, // 请求对象，与现有 Worker API 中的请求对象相同    
        env, // 环境对象，与现有 Worker API 中的环境对象相同    
        params, // 如果文件名包含 [id] 或 [[path]]，则包含参数   
        waitUntil, // 用于管理异步操作，与现有 Worker API 中的 ctx.waitUntil 相同    
        next, // 用于中间件或获取资源    
        data, // 用于在中间件之间传递数据 
    } = context;

    // 解析请求的 URL
    const url = new URL(request.url);

    // 确保路径要么是根路径，要么是 /file/xx.jpg 格式
    if (url.pathname !== "/" && !url.pathname.startsWith("/file/")) {
        return new Response("Invalid Path", { status: 400 });
    }

    // 发起到目标服务器的 HTTP 请求
    const response = fetch('https://telegra.ph/' + url.pathname + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.body,
    }).then(async (response) => {
        console.log(response.ok); // 如果响应状态码为 2xx，则为 true
        console.log(response.status); // 响应状态码，如 200

        if(response.ok){
            // 检查是否设置了图片 URL 变量，并且不为空
            if (typeof env.img_url != "undefined" && env.img_url != null && env.img_url != "") {
                // 从 KV 中获取记录
                const record = await env.img_url.getWithMetadata(params.id); 
                console.log("record")
                console.log(record)
                if (record.metadata !== null) {
                    // 如果记录不为空，则重定向到图片
                    if (record.metadata.ListType=="White"){
                        return response;
                    } else if (record.metadata.ListType=="Block"){
                        console.log("Referer")
                        console.log(request.headers.get('Referer'))
                        if(typeof request.headers.get('Referer') == "undefined" || request.headers.get('Referer') == null || request.headers.get('Referer') == ""){
                            return Response.redirect(url.origin+"/block-img.html", 302)
                        } else {
                            return Response.redirect("https://static-res.pages.dev/teleimage/img-block-compressed.png", 302)
                        }
                    } else if (record.metadata.Label=="adult"){
                        if(typeof request.headers.get('Referer') == "undefined" || request.headers.get('Referer') == null || request.headers.get('Referer') == ""){
                            return Response.redirect(url.origin+"/block-img.html", 302)
                        } else {
                            return Response.redirect("https://static-res.pages.dev/teleimage/img-block-compressed.png", 302)
                        }
                    }

                    // 检查环境变量 WhiteList_Mode 是否设置
                    console.log("env.WhiteList_Mode:",env.WhiteList_Mode)
                    if (env.WhiteList_Mode=="true"){
                        // 如果设置了环境变量 WhiteList_Mode，则重定向到图片
                        return Response.redirect(url.origin+"/whitelist-on.html", 302);
                    } else {
                        // 如果未设置环境变量 WhiteList_Mode，则返回图片
                        return response;
                    }
                }
                
            }

            // 获取时间
            let time = new Date().getTime();
            
            let apikey=env.ModerateContentApiKey
            
            if(typeof apikey == "undefined" || apikey == null || apikey == ""){
                
                if (typeof env.img_url == "undefined" || env.img_url == null || env.img_url == ""){
                    console.log("未启用 KV")
                    
                }else{
                    // 将图片添加到 KV
                    await env.img_url.put(params.id, "",{
                        metadata: { ListType: "None", Label: "None",TimeStamp: time },
                    });
                    
                }
            }else{
                await fetch(`https://api.moderatecontent.com/moderate/?key=`+apikey+`&url=https://telegra.ph/` + url.pathname + url.search).
                then(async (response) => {
                    let moderate_data = await response.json();
                    console.log(moderate_data)
                    console.log("---env.img_url---")
                    console.log(env.img_url=="true")
                    if (typeof env.img_url != "undefined" && env.img_url != null && env.img_url != "") {
                        // 将图片添加到 KV
                        await env.img_url.put(params.id, "",{
                            metadata: { ListType: "None", Label: moderate_data.rating_label,TimeStamp: time },
                        });
                    }  
                    if (moderate_data.rating_label=="adult"){
                        return Response.redirect(url.origin+"/block-img.html", 302)
                    }});
             
            }
        }
        return response;
     });

    return response;
}
