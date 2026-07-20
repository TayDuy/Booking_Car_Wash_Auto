import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  History,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import customerApi from "../../../api/customerApi";
import adminLoyaltyApi from "../../../api/adminLoyaltyApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageLoyaltyPointsPage.css";

function unwrapList(response) {
  const root = response?.data;
  const result = root?.data ?? root;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.content)) {
    return result.content;
  }

  return [];
}

function unwrapObject(response) {
  const root = response?.data;
  return root?.data ?? root ?? {};
}

function normalizeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getCustomerId(customer) {
  return customer?.customerId ?? customer?.id;
}

function getCustomerName(customer) {
  return (
    customer?.fullName ||
    customer?.name ||
    customer?.user?.fullName ||
    "Khách hàng"
  );
}

function getCustomerEmail(customer) {
  return (
    customer?.email ||
    customer?.user?.email ||
    "Không có email"
  );
}

function getCustomerPhone(customer) {
  return (
    customer?.phone ||
    customer?.user?.phone ||
    "Không có SĐT"
  );
}

function getBalanceValue(balance, customer) {
  const candidates = [
    balance?.currentBalance,
    balance?.balance,
    balance?.totalPoints,
    balance?.loyaltyPoints,
    balance?.points,
    customer?.totalPoints,
    customer?.loyaltyPoints,
    customer?.points,
  ];

  const value = candidates.find(
    (candidate) =>
      candidate !== null &&
      candidate !== undefined &&
      candidate !== ""
  );

  return Number(value || 0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(
    "vi-VN"
  );
}

function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
}

function getTransactionTypeLabel(type) {
  const normalizedType = normalizeValue(type);

  if (
    normalizedType.includes("earn") ||
    normalizedType.includes("add") ||
    normalizedType.includes("credit")
  ) {
    return "Cộng điểm";
  }

  if (
    normalizedType.includes("redeem") ||
    normalizedType.includes("spend") ||
    normalizedType.includes("deduct")
  ) {
    return "Đổi điểm";
  }

  if (normalizedType.includes("expire")) {
    return "Hết hạn";
  }

  if (
    normalizedType.includes("adjust") ||
    normalizedType.includes("manual")
  ) {
    return "Điều chỉnh";
  }

  return type || "Không xác định";
}

function getTransactionTypeClass(
  transactionType,
  points
) {
  const normalizedType = normalizeValue(
    transactionType
  );

  if (
    Number(points) > 0 ||
    normalizedType.includes("earn") ||
    normalizedType.includes("add")
  ) {
    return "earn";
  }

  if (
    normalizedType.includes("expire")
  ) {
    return "expire";
  }

  if (
    normalizedType.includes("adjust")
  ) {
    return "adjust";
  }

  return "redeem";
}

function getPaginationItems(
  currentPage,
  totalPages
) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const items = [1];
  const start = Math.max(
    2,
    currentPage - 1
  );
  const end = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  if (start > 2) {
    items.push("ellipsis-start");
  }

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
}

export default function ManageLoyaltyPointsPage() {
  const { showMessage } = useAppDialog();
  const [customers, setCustomers] =
    useState([]);

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(true);

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState(null);

  const [customerKeyword, setCustomerKeyword] =
    useState("");

  const [transactions, setTransactions] =
    useState([]);

  const [balance, setBalance] =
    useState({});

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [
    transactionType,
    setTransactionType,
  ] = useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setTransactions([]);
      setBalance({});
      return;
    }

    loadCustomerLoyalty();
  }, [
    selectedCustomerId,
    transactionType,
  ]);

  async function loadCustomers() {
    setLoadingCustomers(true);

    try {
      const response =
        await customerApi.list();

      const customerList =
        unwrapList(response);

      setCustomers(customerList);

      setSelectedCustomerId(
        (previousCustomerId) => {
          if (previousCustomerId) {
            return previousCustomerId;
          }

          return customerList.length > 0
            ? getCustomerId(
              customerList[0]
            )
            : null;
        }
      );
    } catch (error) {
      console.error(
        "Load loyalty customers failed:",
        error
      );

      setCustomers([]);

      await showMessage({
        title: "Tải khách hàng thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách khách hàng.",
        variant: "error",
      });
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadCustomerLoyalty() {
    setLoadingDetails(true);

    try {
      const [
        transactionsResponse,
        balanceResponse,
      ] = await Promise.all([
        adminLoyaltyApi.getCustomerTransactions(
          selectedCustomerId,
          transactionType
        ),

        adminLoyaltyApi.getCustomerBalance(
          selectedCustomerId
        ),
      ]);

      const transactionList =
        unwrapList(transactionsResponse)
          .sort(
            (
              firstTransaction,
              secondTransaction
            ) => {
              const firstTime =
                firstTransaction.createdAt
                  ? new Date(
                    firstTransaction.createdAt
                  ).getTime()
                  : 0;

              const secondTime =
                secondTransaction.createdAt
                  ? new Date(
                    secondTransaction.createdAt
                  ).getTime()
                  : 0;

              return secondTime - firstTime;
            }
          );

      setTransactions(transactionList);
      setBalance(
        unwrapObject(balanceResponse)
      );
      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Load loyalty details failed:",
        error
      );

      setTransactions([]);
      setBalance({});

      await showMessage({
        title: "Tải lịch sử điểm thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được lịch sử điểm.",
        variant: "error",
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleRefresh() {
    await loadCustomers();

    if (selectedCustomerId) {
      await loadCustomerLoyalty();
    }
  }

  const filteredCustomers = useMemo(() => {
    const keyword = normalizeValue(
      customerKeyword
    );

    return customers.filter((customer) => {
      const searchableText = [
        getCustomerId(customer),
        getCustomerName(customer),
        getCustomerEmail(customer),
        getCustomerPhone(customer),
      ]
        .join(" ")
        .toLowerCase();

      return (
        !keyword ||
        searchableText.includes(keyword)
      );
    });
  }, [customers, customerKeyword]);

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          String(getCustomerId(customer)) ===
          String(selectedCustomerId)
      ) || null,
    [customers, selectedCustomerId]
  );

  const statistics = useMemo(() => {
    return transactions.reduce(
      (result, transaction) => {
        const points = Number(
          transaction.points || 0
        );

        if (points > 0) {
          result.earned += points;
        } else if (points < 0) {
          result.spent += Math.abs(points);
        }

        result.count += 1;

        return result;
      },
      {
        earned: 0,
        spent: 0,
        count: 0,
      }
    );
  }, [transactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      transactions.length / pageSize
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) * pageSize;

      return transactions.slice(
        startIndex,
        startIndex + pageSize
      );
    }, [
      transactions,
      currentPage,
      pageSize,
    ]);

  const paginationItems = useMemo(
    () =>
      getPaginationItems(
        currentPage,
        totalPages
      ),
    [currentPage, totalPages]
  );

  const firstVisible =
    transactions.length === 0
      ? 0
      : (currentPage - 1) *
      pageSize +
      1;

  const lastVisible = Math.min(
    currentPage * pageSize,
    transactions.length
  );

  const currentBalance =
    getBalanceValue(
      balance,
      selectedCustomer
    );

  return (
    <div className="loyalty-admin-page">
      <div className="loyalty-admin-header">
        <div>
          <h1>Quản lý điểm</h1>

          <p>
            Theo dõi số dư và lịch sử giao
            dịch điểm của từng khách hàng.
          </p>
        </div>

        <button
          type="button"
          className="loyalty-refresh-btn"
          onClick={handleRefresh}
          disabled={
            loadingCustomers ||
            loadingDetails
          }
        >
          <RefreshCw
            size={18}
            className={
              loadingCustomers ||
                loadingDetails
                ? "loyalty-spinning"
                : ""
            }
          />

          {loadingCustomers ||
            loadingDetails
            ? "Đang tải..."
            : "Làm mới"}
        </button>
      </div>

      <div className="loyalty-layout">
        <section className="loyalty-customer-card">
          <div className="loyalty-card-title">
            <div>
              <UserRound size={20} />

              <strong>
                Chọn khách hàng
              </strong>
            </div>

            <span>
              {filteredCustomers.length}
            </span>
          </div>

          <div className="loyalty-customer-search">
            <Search size={17} />

            <input
              type="text"
              value={customerKeyword}
              placeholder="Tìm tên, email, SĐT..."
              onChange={(event) =>
                setCustomerKeyword(
                  event.target.value
                )
              }
            />
          </div>

          <div className="loyalty-customer-list">
            {loadingCustomers ? (
              <div className="loyalty-list-empty">
                Đang tải khách hàng...
              </div>
            ) : filteredCustomers.length ===
              0 ? (
              <div className="loyalty-list-empty">
                Không có khách hàng phù
                hợp.
              </div>
            ) : (
              filteredCustomers.map(
                (customer) => {
                  const customerId =
                    getCustomerId(customer);

                  const active =
                    String(customerId) ===
                    String(
                      selectedCustomerId
                    );

                  return (
                    <button
                      type="button"
                      key={customerId}
                      className={`loyalty-customer-item ${active
                        ? "active"
                        : ""
                        }`}
                      onClick={() =>
                        setSelectedCustomerId(
                          customerId
                        )
                      }
                    >
                      <span className="loyalty-customer-avatar">
                        {getCustomerName(
                          customer
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="loyalty-customer-info">
                        <strong>
                          {getCustomerName(
                            customer
                          )}
                        </strong>

                        <small>
                          {
                            getCustomerPhone(
                              customer
                            )
                          }
                        </small>

                        <small>
                          ID: {customerId}
                        </small>
                      </span>
                    </button>
                  );
                }
              )
            )}
          </div>
        </section>

        <section className="loyalty-content">
          {!selectedCustomer ? (
            <div className="loyalty-no-customer">
              Chọn một khách hàng để xem
              thông tin điểm.
            </div>
          ) : (
            <>
              <div className="loyalty-selected-customer">
                <div>
                  <span className="loyalty-selected-avatar">
                    {getCustomerName(
                      selectedCustomer
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <div>
                    <h2>
                      {getCustomerName(
                        selectedCustomer
                      )}
                    </h2>

                    <p>
                      {getCustomerEmail(
                        selectedCustomer
                      )}{" "}
                      ·{" "}
                      {getCustomerPhone(
                        selectedCustomer
                      )}
                    </p>
                  </div>
                </div>

                <span className="loyalty-customer-id">
                  ID:{" "}
                  {getCustomerId(
                    selectedCustomer
                  )}
                </span>
              </div>

              <div className="loyalty-stat-grid">
                <div className="loyalty-stat-card balance">
                  <Coins size={22} />

                  <div>
                    <span>
                      Điểm hiện tại
                    </span>

                    <strong>
                      {formatNumber(
                        currentBalance
                      )}
                    </strong>
                  </div>
                </div>

                <div className="loyalty-stat-card earned">
                  <ArrowUpCircle
                    size={22}
                  />

                  <div>
                    <span>
                      Tổng điểm cộng
                    </span>

                    <strong>
                      +
                      {formatNumber(
                        statistics.earned
                      )}
                    </strong>
                  </div>
                </div>

                <div className="loyalty-stat-card spent">
                  <ArrowDownCircle
                    size={22}
                  />

                  <div>
                    <span>
                      Tổng điểm đã trừ
                    </span>

                    <strong>
                      -
                      {formatNumber(
                        statistics.spent
                      )}
                    </strong>
                  </div>
                </div>

                <div className="loyalty-stat-card count">
                  <History size={22} />

                  <div>
                    <span>
                      Số giao dịch
                    </span>

                    <strong>
                      {statistics.count}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="loyalty-transaction-card">
                <div className="loyalty-transaction-header">
                  <div>
                    <h3>
                      Lịch sử giao dịch
                    </h3>

                    <p>
                      Theo dõi các lần cộng,
                      trừ và đổi điểm.
                    </p>
                  </div>

                  <select
                    value={transactionType}
                    onChange={(event) =>
                      setTransactionType(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      Tất cả giao dịch
                    </option>

                    <option value="earn">
                      Cộng điểm
                    </option>

                    <option value="redeem">
                      Đổi điểm
                    </option>

                    <option value="expire">
                      Điểm hết hạn
                    </option>

                    <option value="adjust">
                      Điều chỉnh
                    </option>
                  </select>
                </div>

                {loadingDetails ? (
                  <div className="loyalty-table-empty">
                    Đang tải lịch sử điểm...
                  </div>
                ) : transactions.length ===
                  0 ? (
                  <div className="loyalty-table-empty">
                    Khách hàng chưa có giao
                    dịch điểm.
                  </div>
                ) : (
                  <>
                    <div className="loyalty-table-wrap">
                      <table className="loyalty-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>
                              Loại giao dịch
                            </th>
                            <th>Số điểm</th>
                            <th>
                              Số dư trước
                            </th>
                            <th>
                              Số dư sau
                            </th>
                            <th>Ghi chú</th>
                            <th>Thời gian</th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedTransactions.map(
                            (
                              transaction,
                              index
                            ) => {
                              const points =
                                Number(
                                  transaction.points ||
                                  0
                                );

                              const typeClass =
                                getTransactionTypeClass(
                                  transaction.transactionType,
                                  points
                                );

                              return (
                                <tr
                                  key={
                                    transaction.loyaltyTransactionId ||
                                    index
                                  }
                                >
                                  <td>
                                    {(currentPage -
                                      1) *
                                      pageSize +
                                      index +
                                      1}
                                  </td>

                                  <td>
                                    <span
                                      className={`loyalty-type-badge ${typeClass}`}
                                    >
                                      {getTransactionTypeLabel(
                                        transaction.transactionType
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    <strong
                                      className={`loyalty-points-value ${typeClass}`}
                                    >
                                      {points >
                                        0
                                        ? "+"
                                        : ""}
                                      {formatNumber(
                                        points
                                      )}
                                    </strong>
                                  </td>

                                  <td>
                                    {formatNumber(
                                      transaction.balanceBefore
                                    )}
                                  </td>

                                  <td>
                                    <strong>
                                      {formatNumber(
                                        transaction.balanceAfter
                                      )}
                                    </strong>
                                  </td>

                                  <td>
                                    {transaction.note ||
                                      "Không có"}
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      transaction.createdAt
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="loyalty-pagination">
                      <div>
                        Hiển thị{" "}
                        <strong>
                          {firstVisible}–
                          {lastVisible}
                        </strong>{" "}
                        trong tổng số{" "}
                        <strong>
                          {
                            transactions.length
                          }
                        </strong>{" "}
                        giao dịch
                      </div>

                      <div className="loyalty-pagination-controls">
                        <button
                          type="button"
                          disabled={
                            currentPage === 1
                          }
                          onClick={() =>
                            setCurrentPage(
                              (
                                previousPage
                              ) =>
                                Math.max(
                                  previousPage -
                                  1,
                                  1
                                )
                            )
                          }
                        >
                          Trước
                        </button>

                        {paginationItems.map(
                          (item) =>
                            typeof item ===
                              "number" ? (
                              <button
                                type="button"
                                key={item}
                                className={
                                  item ===
                                    currentPage
                                    ? "active"
                                    : ""
                                }
                                onClick={() =>
                                  setCurrentPage(
                                    item
                                  )
                                }
                              >
                                {item}
                              </button>
                            ) : (
                              <span
                                key={item}
                              >
                                …
                              </span>
                            )
                        )}

                        <button
                          type="button"
                          disabled={
                            currentPage ===
                            totalPages
                          }
                          onClick={() =>
                            setCurrentPage(
                              (
                                previousPage
                              ) =>
                                Math.min(
                                  previousPage +
                                  1,
                                  totalPages
                                )
                            )
                          }
                        >
                          Sau
                        </button>
                      </div>

                      <label>
                        <span>Mỗi trang</span>

                        <select
                          value={pageSize}
                          onChange={(
                            event
                          ) =>
                            setPageSize(
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                        >
                          <option value={10}>
                            10
                          </option>

                          <option value={20}>
                            20
                          </option>

                          <option value={50}>
                            50
                          </option>
                        </select>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}