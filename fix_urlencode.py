import re

with open(r"C:\Users\Chintu\Documents\Code\langs\C++ project\backend\src\server_main.cpp", "r") as f:
    content = f.read()

old = """static string jsonEscape(const string& s) {
    string o;
    o.reserve(s.size() + 2);
    for (char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if ((unsigned char)c < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", (unsigned char)c);
                    o += buf;
                } else {
                    o += c;
                }
        }
    }
    return o;
}

struct JsonVal {"""

new = """static string jsonEscape(const string& s) {
    string o;
    o.reserve(s.size() + 2);
    for (char c : s) {
        switch (c) {
            case '"': o += "\\\""; break;
            case '\\': o += "\\\\"; break;
            case '\n': o += "\\n"; break;
            case '\r': o += "\\r"; break;
            case '\t': o += "\\t"; break;
            default:
                if ((unsigned char)c < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", (unsigned char)c);
                    o += buf;
                } else {
                    o += c;
                }
        }
    }
    return o;
}

static string urlDecode(const string& s) {
    string out;
    out.reserve(s.size());
    for (size_t i = 0; i < s.size(); ++i) {
        if (s[i] == '%' && i + 2 < s.size()) {
            int hi = 0, lo = 0;
            char c1 = s[i+1], c2 = s[i+2];
            if (c1 >= '0' && c1 <= '9') hi = c1 - '0';
            else if (c1 >= 'A' && c1 <= 'F') hi = c1 - 'A' + 10;
            else if (c1 >= 'a' && c1 <= 'f') hi = c1 - 'a' + 10;
            if (c2 >= '0' && c2 <= '9') lo = c2 - '0';
            else if (c2 >= 'A' && c2 <= 'F') lo = c2 - 'A' + 10;
            else if (c2 >= 'a' && c2 <= 'f') lo = c2 - 'a' + 10;
            out += char((hi << 4) | lo);
            i += 2;
        } else if (s[i] == '+') {
            out += ' ';
        } else {
            out += s[i];
        }
    }
    return out;
}

struct JsonVal {"""

if old in content:
    content = content.replace(old, new)
    with open(r"C:\Users\Chintu\Documents\Code\langs\C++ project\backend\src\server_main.cpp", "w") as f:
        f.write(content)
    print("Successfully added urlDecode function")
else:
    print("Pattern not found exactly - trying to locate")
    idx = content.find("static string jsonEscape")
    if idx >= 0:
        idx2 = content.find("struct JsonVal", idx)
        if idx2 >= 0:
            print(f"Found jsonEscape at {idx}, struct JsonVal at {idx2}")
