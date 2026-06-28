package com.devtools.service;

import org.springframework.stereotype.Service;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.HashMap;

/**
 * 编码解码服务 - 处理 URL 编码、HTML 实体、摩尔斯电码等
 */
@Service
public class EncodeService {

    /**
     * URL 编解码
     */
    public Map<String, String> urlCode(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        result.put("input", input);
        try {
            if ("encode".equals(mode)) {
                result.put("output", URLEncoder.encode(input, StandardCharsets.UTF_8));
            } else {
                result.put("output", URLDecoder.decode(input, StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            result.put("error", "URL 编解码失败: " + e.getMessage());
        }
        return result;
    }

    /**
     * HTML 实体编解码
     */
    public Map<String, String> htmlEntity(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        result.put("input", input);
        try {
            if ("encode".equals(mode)) {
                result.put("output", htmlEncode(input));
            } else {
                result.put("output", htmlDecode(input));
            }
        } catch (Exception e) {
            result.put("error", "HTML 实体编解码失败: " + e.getMessage());
        }
        return result;
    }

    private static final Map<Character, String> HTML_ENTITIES = new HashMap<>();
    static {
        HTML_ENTITIES.put('&', "&amp;");
        HTML_ENTITIES.put('<', "&lt;");
        HTML_ENTITIES.put('>', "&gt;");
        HTML_ENTITIES.put('"', "&quot;");
        HTML_ENTITIES.put('\'', "&#39;");
    }

    private String htmlEncode(String input) {
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            String entity = HTML_ENTITIES.get(c);
            if (entity != null) {
                sb.append(entity);
            } else if (c > 127) {
                sb.append("&#").append((int) c).append(";");
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private String htmlDecode(String input) {
        String result = input;
        result = result.replace("&amp;", "&");
        result = result.replace("&lt;", "<");
        result = result.replace("&gt;", ">");
        result = result.replace("&quot;", "\"");
        result = result.replace("&#39;", "'");
        // 数字实体解码
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("&#(\\d+);");
        java.util.regex.Matcher matcher = pattern.matcher(result);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            int codePoint = Integer.parseInt(matcher.group(1));
            matcher.appendReplacement(sb, String.valueOf((char) codePoint));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * 摩尔斯电码编解码
     */
    public Map<String, String> morse(String input, String mode) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("mode", mode);
        result.put("input", input);
        try {
            if ("encode".equals(mode)) {
                result.put("output", textToMorse(input));
            } else {
                result.put("output", morseToText(input));
            }
        } catch (Exception e) {
            result.put("error", "摩尔斯电码编解码失败: " + e.getMessage());
        }
        return result;
    }

    private static final Map<Character, String> CHAR_TO_MORSE = new LinkedHashMap<>();
    private static final Map<String, Character> MORSE_TO_CHAR = new LinkedHashMap<>();

    static {
        String[][] pairs = {
            {"A", ".-"}, {"B", "-..."}, {"C", "-.-."}, {"D", "-.."}, {"E", "."},
            {"F", "..-."}, {"G", "--."}, {"H", "...."}, {"I", ".."}, {"J", ".---"},
            {"K", "-.-"}, {"L", ".-.."}, {"M", "--"}, {"N", "-."}, {"O", "---"},
            {"P", ".--."}, {"Q", "--.-"}, {"R", ".-."}, {"S", "..."}, {"T", "-"},
            {"U", "..-"}, {"V", "...-"}, {"W", ".--"}, {"X", "-..-"}, {"Y", "-.--"},
            {"Z", "--.."},
            {"0", "-----"}, {"1", ".----"}, {"2", "..---"}, {"3", "...--"}, {"4", "....-"},
            {"5", "....."}, {"6", "-...."}, {"7", "--..."}, {"8", "---.."}, {"9", "----."},
            {".", ".-.-.-"}, {",", "--..--"}, {"?", "..--.."}, {"'", ".----."},
            {"!", "-.-.--"}, {"/", "-..-."}, {"(", "-.--."}, {")", "-.--.-"},
            {"&", ".-..."}, {":", "---..."}, {";", "-.-.-."}, {"=", "-...-"},
            {"+", ".-.-."}, {"-", "-....-"}, {"_", "..--.-"}, {"\"", ".-..-."},
            {"@", ".--.-."}, {" ", "/"}
        };
        for (String[] pair : pairs) {
            CHAR_TO_MORSE.put(pair[0].charAt(0), pair[1]);
            MORSE_TO_CHAR.put(pair[1], pair[0].charAt(0));
        }
    }

    private String textToMorse(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toUpperCase().toCharArray()) {
            String code = CHAR_TO_MORSE.get(c);
            if (code != null) {
                if (!sb.isEmpty()) sb.append(' ');
                sb.append(code);
            }
        }
        return sb.toString();
    }

    private String morseToText(String morse) {
        StringBuilder sb = new StringBuilder();
        String[] codes = morse.trim().split("\\s+");
        for (String code : codes) {
            Character c = MORSE_TO_CHAR.get(code);
            if (c != null) {
                sb.append(c);
            }
        }
        return sb.toString().replace("/", " ");
    }
}
