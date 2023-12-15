export async function onRequest(context) {
    const imageUrl = "https://im.030101.xyz/file/e1494ecac10d59c88cc9f.jpg";

    // 直接返回图片的 URL
    return new Response(null, {
        status: 302, // 302 Found
        headers: {
            "Location": imageUrl,
        },
    });
}
