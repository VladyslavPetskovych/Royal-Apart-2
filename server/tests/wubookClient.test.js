const test = require("node:test");
const assert = require("node:assert/strict");
const { fetchPlanPrices } = require("../services/revenue/wubookClient");

test("fetchPlanPrices parses mocked XML-RPC response", async () => {
  const xml = `<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
      <value>
        <array>
          <data>
            <value><int>0</int></value>
            <value>
              <struct>
                <member>
                  <name>RM01</name>
                  <value>
                    <array>
                      <data>
                        <value><double>1000</double></value>
                        <value><double>1100</double></value>
                      </data>
                    </array>
                  </value>
                </member>
              </struct>
            </value>
          </data>
        </array>
      </value>
    </param>
  </params>
</methodResponse>`;

  const mockHttp = {
    post: async () => ({ data: xml }),
  };

  const result = await fetchPlanPrices(
    {
      token: "tkn",
      lcode: 1,
      planId: 2,
      dateFrom: "01/04/2025",
      dateTo: "02/04/2025",
    },
    mockHttp
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].room_code, "RM01");
  assert.equal(result[0].tariff_price, 1000);
});
