from app.infrastructure.parser.natural_input_parser import parse_invoice_text


def test_parser_extracts_client_and_lines():
    text = "Cliente: Frio Norte SL; Instalacion split x 2 @ 125,50; Mantenimiento x 1 @ 90,00"
    parsed = parse_invoice_text(text)
    assert parsed.client_hint == "Frio Norte SL"
    assert len(parsed.lines) == 2
    assert str(parsed.lines[0].quantity) == "2.00"
    assert str(parsed.lines[0].unit_price) == "125.50"


def test_parser_warns_when_missing_data():
    parsed = parse_invoice_text("texto libre sin estructura")
    assert parsed.warnings
