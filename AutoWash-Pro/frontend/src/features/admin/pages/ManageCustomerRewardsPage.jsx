import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Gift,
  RefreshCw,
  Search,
  TicketCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import customerApi from "../../../api/customerApi";
import adminCustomerRewardApi from "../../../api/adminCustomerRewardApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageCustomerRewardsPage.css";

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

function getEffectiveStatus(reward) {
  const status = normalizeValue(
    reward?.status
  );

  if (status === "used") {
    return "used";
  }

  if (status === "expired") {
    return "expired";
  }

  if (reward?.expiredAt) {
    const expiredTime = new Date(
      reward.expiredAt
    ).getTime();

    if (
      !Number.isNaN(expiredTime) &&
      expiredTime < Date.now()
    ) {
      return "expired";
    }
  }

  return "unused";
}

function getStatusLabel(status) {
  switch (status) {
    case "unused":
      return "Chưa sử dụng";

    case "used":
      return "Đã sử dụng";

    case "expired":
      return "Đã hết hạn";

    default:
      return status || "Không xác định";
  }
}

function getDiscountTypeLabel(type) {
  switch (normalizeValue(type)) {
    case "discount":
      return "Giảm giá";

    case "free_wash":
      return "Miễn phí rửa xe";

    case "addon":
      return "Tặng dịch vụ phụ";

    default:
      return type || "N/A";
  }
}

function getDiscountValueLabel(reward) {
  const type = normalizeValue(
    reward?.discountType
  );

  const value = formatNumber(
    reward?.discountValue
  );

  if (type === "free_wash") {
    return `${value}%`;
  }

  return `${value} đ`;
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

  const startPage = Math.max(
    2,
    currentPage - 1
  );

  const endPage = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  if (startPage > 2) {
    items.push("ellipsis-start");
  }

  for (
    let page = startPage;
    page <= endPage;
    page += 1
  ) {
    items.push(page);
  }

  if (endPage < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
}

export default function ManageCustomerRewardsPage() {
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

  const [
    customerKeyword,
    setCustomerKeyword,
  ] = useState("");

  const [rewards, setRewards] =
    useState([]);

  const [
    loadingRewards,
    setLoadingRewards,
  ] = useState(false);

  const [rewardKeyword, setRewardKeyword] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedReward, setSelectedReward] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setRewards([]);
      return;
    }

    loadCustomerRewards();
  }, [selectedCustomerId]);

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
          const stillExists =
            customerList.some(
              (customer) =>
                String(
                  getCustomerId(customer)
                ) ===
                String(
                  previousCustomerId
                )
            );

          if (
            previousCustomerId &&
            stillExists
          ) {
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
        "Load voucher customers failed:",
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

  async function loadCustomerRewards() {
    setLoadingRewards(true);

    try {
      const response =
        await adminCustomerRewardApi.getAllCustomerRewards();

      const allRewards = unwrapList(response);

      const rewardList = allRewards
        .filter(
          (reward) =>
            String(reward.customerId) ===
            String(selectedCustomerId)
        )
        .sort((firstReward, secondReward) => {
          const firstTime = firstReward.redeemedAt
            ? new Date(firstReward.redeemedAt).getTime()
            : 0;

          const secondTime = secondReward.redeemedAt
            ? new Date(secondReward.redeemedAt).getTime()
            : 0;

          return secondTime - firstTime;
        });

      setRewards(rewardList);
      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Load customer vouchers failed:",
        error
      );

      setRewards([]);

      await showMessage({
        title: "Tải voucher thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được voucher của khách hàng.",
        variant: "error",
      });
    } finally {
      setLoadingRewards(false);
    }
  }

  async function handleRefresh() {
    await loadCustomers();

    if (selectedCustomerId) {
      await loadCustomerRewards();
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
          String(
            getCustomerId(customer)
          ) ===
          String(selectedCustomerId)
      ) || null,
    [customers, selectedCustomerId]
  );

  const statistics = useMemo(() => {
    return rewards.reduce(
      (result, reward) => {
        result.total += 1;

        const status =
          getEffectiveStatus(reward);

        if (status === "unused") {
          result.unused += 1;
        }

        if (status === "used") {
          result.used += 1;
        }

        if (status === "expired") {
          result.expired += 1;
        }

        return result;
      },
      {
        total: 0,
        unused: 0,
        used: 0,
        expired: 0,
      }
    );
  }, [rewards]);

  const filteredRewards = useMemo(() => {
    const keyword = normalizeValue(
      rewardKeyword
    );

    return rewards.filter((reward) => {
      const effectiveStatus =
        getEffectiveStatus(reward);

      const searchableText = [
        reward.customerRewardId,
        reward.rewardId,
        reward.rewardName,
        reward.voucherCode,
        reward.discountType,
        reward.discountValue,
        reward.redeemedPoints,
        reward.usedBookingId,
        effectiveStatus,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        !keyword ||
        searchableText.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        effectiveStatus === statusFilter;

      return (
        matchesKeyword &&
        matchesStatus
      );
    });
  }, [
    rewards,
    rewardKeyword,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    rewardKeyword,
    statusFilter,
    pageSize,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRewards.length / pageSize
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRewards = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    return filteredRewards.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    filteredRewards,
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
    filteredRewards.length === 0
      ? 0
      : (currentPage - 1) *
      pageSize +
      1;

  const lastVisible = Math.min(
    currentPage * pageSize,
    filteredRewards.length
  );

  return (
    <div className="customer-reward-admin-page">
      <div className="customer-reward-header">
        <div>
          <h1>Voucher khách hàng</h1>

          <p>
            Theo dõi voucher mà khách hàng
            đã nhận sau khi đổi điểm.
          </p>
        </div>

        <button
          type="button"
          className="customer-reward-refresh"
          onClick={handleRefresh}
          disabled={
            loadingCustomers ||
            loadingRewards
          }
        >
          <RefreshCw
            size={18}
            className={
              loadingCustomers ||
                loadingRewards
                ? "customer-reward-spinning"
                : ""
            }
          />

          {loadingCustomers ||
            loadingRewards
            ? "Đang tải..."
            : "Làm mới"}
        </button>
      </div>

      <div className="customer-reward-layout">
        <section className="customer-reward-customer-card">
          <div className="customer-reward-card-title">
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

          <div className="customer-reward-customer-search">
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

          <div className="customer-reward-customer-list">
            {loadingCustomers ? (
              <div className="customer-reward-empty">
                Đang tải khách hàng...
              </div>
            ) : filteredCustomers.length ===
              0 ? (
              <div className="customer-reward-empty">
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
                      className={`customer-reward-customer-item ${active
                        ? "active"
                        : ""
                        }`}
                      onClick={() =>
                        setSelectedCustomerId(
                          customerId
                        )
                      }
                    >
                      <span className="customer-reward-avatar">
                        {getCustomerName(
                          customer
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="customer-reward-customer-info">
                        <strong>
                          {getCustomerName(
                            customer
                          )}
                        </strong>

                        <small>
                          {getCustomerPhone(
                            customer
                          )}
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

        <section className="customer-reward-content">
          {!selectedCustomer ? (
            <div className="customer-reward-no-customer">
              Chọn một khách hàng để xem
              voucher.
            </div>
          ) : (
            <>
              <div className="customer-reward-selected">
                <div>
                  <span className="customer-reward-selected-avatar">
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

                <span className="customer-reward-customer-id">
                  ID:{" "}
                  {getCustomerId(
                    selectedCustomer
                  )}
                </span>
              </div>

              <div className="customer-reward-stat-grid">
                <div className="customer-reward-stat-card total">
                  <Gift size={22} />

                  <div>
                    <span>
                      Tổng voucher
                    </span>

                    <strong>
                      {statistics.total}
                    </strong>
                  </div>
                </div>

                <div className="customer-reward-stat-card unused">
                  <TicketCheck size={22} />

                  <div>
                    <span>
                      Chưa sử dụng
                    </span>

                    <strong>
                      {statistics.unused}
                    </strong>
                  </div>
                </div>

                <div className="customer-reward-stat-card used">
                  <CheckCircle2 size={22} />

                  <div>
                    <span>Đã sử dụng</span>

                    <strong>
                      {statistics.used}
                    </strong>
                  </div>
                </div>

                <div className="customer-reward-stat-card expired">
                  <XCircle size={22} />

                  <div>
                    <span>Đã hết hạn</span>

                    <strong>
                      {statistics.expired}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="customer-reward-table-card">
                <div className="customer-reward-toolbar">
                  <div className="customer-reward-search">
                    <Search size={17} />

                    <input
                      type="text"
                      value={rewardKeyword}
                      placeholder="Tìm mã voucher, phần thưởng, booking..."
                      onChange={(event) =>
                        setRewardKeyword(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                  >
                    <option value="all">
                      Tất cả trạng thái
                    </option>

                    <option value="unused">
                      Chưa sử dụng
                    </option>

                    <option value="used">
                      Đã sử dụng
                    </option>

                    <option value="expired">
                      Đã hết hạn
                    </option>
                  </select>
                </div>

                {loadingRewards ? (
                  <div className="customer-reward-table-empty">
                    Đang tải voucher...
                  </div>
                ) : filteredRewards.length ===
                  0 ? (
                  <div className="customer-reward-table-empty">
                    Khách hàng chưa có
                    voucher phù hợp.
                  </div>
                ) : (
                  <>
                    <div className="customer-reward-table-wrap">
                      <table className="customer-reward-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>
                              Mã voucher
                            </th>
                            <th>
                              Phần thưởng
                            </th>
                            <th>
                              Điểm đã đổi
                            </th>
                            <th>Giá trị</th>
                            <th>
                              Trạng thái
                            </th>
                            <th>Ngày đổi</th>
                            <th>
                              Hết hạn
                            </th>
                            <th>Booking</th>
                            <th>
                              Thao tác
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {paginatedRewards.map(
                            (
                              reward,
                              index
                            ) => {
                              const status =
                                getEffectiveStatus(
                                  reward
                                );

                              return (
                                <tr
                                  key={
                                    reward.customerRewardId ||
                                    reward.voucherCode ||
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
                                    <strong className="customer-reward-code">
                                      {reward.voucherCode ||
                                        "N/A"}
                                    </strong>
                                  </td>

                                  <td>
                                    {reward.rewardName ||
                                      "N/A"}
                                  </td>

                                  <td>
                                    <strong className="customer-reward-points">
                                      {formatNumber(
                                        reward.redeemedPoints
                                      )}{" "}
                                      điểm
                                    </strong>
                                  </td>

                                  <td>
                                    <span>
                                      {getDiscountTypeLabel(
                                        reward.discountType
                                      )}
                                    </span>

                                    <small className="customer-reward-value">
                                      {getDiscountValueLabel(
                                        reward
                                      )}
                                    </small>
                                  </td>

                                  <td>
                                    <span
                                      className={`customer-reward-status ${status}`}
                                    >
                                      {getStatusLabel(
                                        status
                                      )}
                                    </span>
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      reward.redeemedAt
                                    )}
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      reward.expiredAt
                                    )}
                                  </td>

                                  <td>
                                    {reward.usedBookingId
                                      ? `#${reward.usedBookingId}`
                                      : "Chưa dùng"}
                                  </td>

                                  <td>
                                    <button
                                      type="button"
                                      className="customer-reward-view-btn"
                                      title="Xem chi tiết"
                                      onClick={() =>
                                        setSelectedReward(
                                          reward
                                        )
                                      }
                                    >
                                      <Eye
                                        size={16}
                                      />
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="customer-reward-pagination">
                      <div>
                        Hiển thị{" "}
                        <strong>
                          {firstVisible}–
                          {lastVisible}
                        </strong>{" "}
                        trong tổng số{" "}
                        <strong>
                          {
                            filteredRewards.length
                          }
                        </strong>{" "}
                        voucher
                      </div>

                      <div className="customer-reward-pagination-controls">
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

      {selectedReward && (
        <div
          className="customer-reward-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedReward(null);
            }
          }}
        >
          <div className="customer-reward-modal">
            <div className="customer-reward-modal-header">
              <div>
                <span>
                  Chi tiết voucher
                </span>

                <h2>
                  {selectedReward.voucherCode ||
                    "N/A"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReward(null)
                }
              >
                <X size={21} />
              </button>
            </div>

            <div className="customer-reward-detail-grid">
              <div>
                <span>
                  Tên phần thưởng
                </span>

                <strong>
                  {selectedReward.rewardName ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>Trạng thái</span>

                <strong>
                  {getStatusLabel(
                    getEffectiveStatus(
                      selectedReward
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>Điểm đã đổi</span>

                <strong>
                  {formatNumber(
                    selectedReward.redeemedPoints
                  )}{" "}
                  điểm
                </strong>
              </div>

              <div>
                <span>Giá trị</span>

                <strong>
                  {getDiscountValueLabel(
                    selectedReward
                  )}
                </strong>
              </div>

              <div>
                <span>Ngày đổi</span>

                <strong>
                  {formatDateTime(
                    selectedReward.redeemedAt
                  )}
                </strong>
              </div>

              <div>
                <span>Ngày hết hạn</span>

                <strong>
                  {formatDateTime(
                    selectedReward.expiredAt
                  )}
                </strong>
              </div>

              <div>
                <span>Ngày sử dụng</span>

                <strong>
                  {formatDateTime(
                    selectedReward.usedAt
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Booking đã sử dụng
                </span>

                <strong>
                  {selectedReward.usedBookingId
                    ? `#${selectedReward.usedBookingId}`
                    : "Chưa sử dụng"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}