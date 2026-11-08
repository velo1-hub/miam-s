-- « Vendre mon auto »: a private owner offers a vehicle to the dealership outright, with an asking price.
-- Stored as a lead like the others; vehicle details and the asking price live in leads.payload.
alter type lead_type add value if not exists 'sell_car' after 'trade_in';
