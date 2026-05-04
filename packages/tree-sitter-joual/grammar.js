module.exports = grammar({
  name: "joual",

  extras: ($) => [/\s+/, $.comment],

  rules: {
    source_file: ($) => repeat($._statement),
    comment: ($) => seq("TYL", /.*/),

    _statement: ($) =>
      choice($.let_statement, $.return_statement, $.print_statement, $.expression_statement),

    let_statement: ($) =>
      seq(
        "MET MOI CA ICITTE",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        optional(";")
      ),

    return_statement: ($) =>
      seq("TOKEBEC", $._expression, optional("")),

    print_keyword: ($) => "GAROCHE MOI CA",

    builtin_keyword: ($) =>
      token(prec(1, choice(
        /CEST LONG COMMENT/,
        /BOUTE DU BOUTE/
      )))),

    print_statement: ($) =>
      seq(
        $.print_keyword,
        "(",
        field("value", $._expression),
        ")",
        optional(";")
      ),

    expression_statement: ($) => seq($._expression, optional(";")),

    block_statement: ($) => seq("{", repeat($._statement), "}"),

    if_expression: ($) =>
      seq(
        "AMETON QUE",
        "(",
        field("condition", $._expression),
        ")",
        field("consequence", $.block_statement),
        optional(seq("SINON LA", field("alternative", $.block_statement)))
      ),

    function_literal: ($) =>
      seq(
        "JAI JAMAIS TOUCHER A MES FILLES",
        "(",
        optional(field("parameters", $.parameter_list)),
        ")",
        optional(seq("->", field("return_type", $.type))),
        field("body", repeat($._statement)),
        "SAUF UNE FOIS AU CHALET"
      ),

    parameter_list: ($) =>
      seq($.parameter, repeat(seq(",", $.parameter))),

    parameter: ($) =>
      seq(field("name", $.identifier), optional(seq(":", field("type", $.type)))),

    type: ($) => choice("Int", "Bool", "String", "Array"),

    call_expression: ($) =>
      prec(
        1,
        seq(
          field("function", choice($.identifier, $.builtin_keyword)),
          "(",
          optional(field("arguments", $.argument_list)),
          ")"
        )
      ),

    argument_list: ($) =>
      seq($._expression, repeat(seq(",", $._expression))),

    index_expression: ($) =>
      prec.left(
        4,
        seq(field("object", $._expression), "[", field("index", $._expression), "]")
      ),

    infix_expression: ($) =>
      choice(
        prec.left(
          2,
          seq(
            field("left", $._expression),
            field("operator", choice("+", "-")),
            field("right", $._expression)
          )
        ),
        prec.left(
          3,
          seq(
            field("left", $._expression),
            field("operator", choice("*", "/")),
            field("right", $._expression)
          )
        ),
        prec.left(
          1,
          seq(
            field("left", $._expression),
            field("operator", choice("<", ">", "==", "!=")),
            field("right", $._expression)
          )
        )
      ),

    prefix_expression: ($) =>
      prec(
        5,
        seq(
          field("operator", choice("!", "-")),
          field("operand", $._expression)
        )
      ),

    array_literal: ($) =>
      seq(
        "[",
        optional(seq($._expression, repeat(seq(",", $._expression)))),
        "]"
      ),

    _expression: ($) =>
      choice(
        $.if_expression,
        $.function_literal,
        $.call_expression,
        $.index_expression,
        $.infix_expression,
        $.prefix_expression,
        $.array_literal,
        $.identifier,
        $.integer_literal,
        $.string_literal,
        $.boolean_literal
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    integer_literal: ($) => /[0-9]+/,
    string_literal: ($) => token(seq('"', /[^"]*/, '"')),
    boolean_literal: ($) => choice("true", "false"),
  },
});
