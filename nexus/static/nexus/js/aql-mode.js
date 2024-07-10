CodeMirror.defineMode("aqlMode", function(config, parserConfig) {
    function tokenBase(stream, state) {
        var ch = stream.next();
        if (ch === '"' || ch === "'") {
            state.tokenize = tokenString(ch);
            return state.tokenize(stream, state);
        }
        if (/[\[\]{}\(\),;\.]/.test(ch)) {
            return "bracket";
        }
        if (/\d/.test(ch)) {
            stream.eatWhile(/[\w\.]/);
            return "number";
        }
        if (ch === "/") {
            if (stream.eat("*")) {
                state.tokenize = tokenComment;
                return tokenComment(stream, state);
            }
            if (stream.eat("/")) {
                stream.skipToEnd();
                return "comment";
            }
        }
        if (/[+\-*&%=<>!?|]/.test(ch)) {
            stream.eatWhile(/[+\-*&%=<>!?|]/);
            return "operator";
        }
        stream.eatWhile(/[\w\$_]/);
        var cur = stream.current().toLowerCase();
        if ([
            "true", "false", "null", "find", "filter", "display", "aggregate", "sort", 
            "group", "limit", "select", "from", "where", "join", "order", "by", "asc", 
            "desc", "insert", "update", "delete", "create", "drop", "alter", "add", 
            "rename", "set", "unset", "define", "module", "components", "features", 
            "description", "quantum", "compute", "integration", "compatibility", 
            "try", "catch", "finally", "throw", "async", "await", "extends", 
            "implements", "execute", "analyze", "transpile", "optimize", "run", 
            "compile", "initialize", "aql", "aqlnexus", "quantether"
        ].includes(cur)) return "keyword";
        if ([
            "string", "number", "boolean", "date", "array", "object", "entity", "goal", 
            "role", "type", "enum", "qubit", "quantumcircuit", "quantumalgorithm", 
            "coherence", "errorcorrection", "net_profit", "total_revenue", 
            "total_expenses", "profit_margin", "return_on_investment", 
            "revenue_growth_rate", "expense_growth_rate", "debt_to_equity_ratio"
        ].includes(cur)) return "type";
        return "variable";
    }

    function tokenString(quote) {
        return function(stream, state) {
            var escaped = false, next, end = false;
            while ((next = stream.next()) != null) {
                if (next === quote && !escaped) {
                    end = true;
                    break;
                }
                escaped = !escaped && next === "\\";
            }
            if (end)
                state.tokenize = tokenBase;
            return "string";
        };
    }

    function tokenComment(stream, state) {
        var maybeEnd = false, ch;
        while ((ch = stream.next())) {
            if (ch === "/" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch === "*");
        }
        return "comment";
    }

    return {
        startState: function() {
            return {tokenize: tokenBase};
        },
        token: function(stream, state) {
            if (stream.eatSpace()) return null;
            return state.tokenize(stream, state);
        },
        lineComment: "--",
        blockCommentStart: "/*",
        blockCommentEnd: "*/",
        fold: "brace"
    };
});

CodeMirror.defineMIME("text/x-aql", "aqlMode");
