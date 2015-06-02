/**
StockSummaries
A summary of the sales and stock updates that occurred in a given store, 
between the previous summary and the timestamp.
----
store: store id
timestamp
items[]
	product: product id
	soldQty: the number of sales for this summary
	previousSoldQty: the sum of all previous summaries' soldQty
	receivedQty: the number of stock updates for this summary
	previousReceivedQty: the sum of all previous summaries' receivedQty
*/
StockSummaries = new Mongo.Collection("stocksummaries");
