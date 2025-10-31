function encodeCursor(obj) {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, "base64url").toString());
    } catch (error) {
        console.error("decodeCursor error:", error);
        return null;
    }
}
export { encodeCursor, decodeCursor };
