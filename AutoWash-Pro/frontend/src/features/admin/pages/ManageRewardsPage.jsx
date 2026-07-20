import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  Eye,
  Gift,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import rewardApi from "../../../api/rewardApi";
import { useAppDialog } from "../../../contexts/DialogContext.jsx";
import "./ManageRewardsPage.css";

const emptyForm = {
  rewardName: "",
  requiredPoints: "",
  rewardType: "discount",
  rewardValue: "",
  vehicleType: "car",
  status: "active",
  requiredTierLevel: "",
};

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
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
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

function getRewardTypeLabel(type) {
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

function getRewardTypeClass(type) {
  switch (normalizeValue(type)) {
    case "discount":
      return "discount";

    case "free_wash":
      return "free-wash";

    case "addon":
      return "addon";

    default:
      return "default";
  }
}

function getRewardValueLabel(reward) {
  const type = normalizeValue(reward.rewardType);
  const value = formatNumber(reward.rewardValue);

  if (type === "free_wash") {
    return `${value}%`;
  }

  return `${value} đ`;
}

function getPaginationItems(currentPage, totalPages) {
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

export default function ManageRewardsPage() {
  const { confirmAction, showMessage } = useAppDialog();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [typeFilter, setTypeFilter] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(10);

  const [showForm, setShowForm] =
    useState(false);
  const [editingReward, setEditingReward] =
    useState(null);
  const [selectedReward, setSelectedReward] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    setLoading(true);

    try {
      const response = await rewardApi.list();

      const rewardList = unwrapList(response)
        .sort((firstReward, secondReward) => {
          const firstTime = firstReward.createdAt
            ? new Date(
              firstReward.createdAt
            ).getTime()
            : 0;

          const secondTime = secondReward.createdAt
            ? new Date(
              secondReward.createdAt
            ).getTime()
            : 0;

          if (secondTime !== firstTime) {
            return secondTime - firstTime;
          }

          return (
            Number(
              secondReward.rewardId || 0
            ) -
            Number(
              firstReward.rewardId || 0
            )
          );
        });

      setRewards(rewardList);

      console.log(
        "ADMIN REWARDS:",
        rewardList
      );
    } catch (error) {
      console.error(
        "Load rewards failed:",
        error
      );

      setRewards([]);

      await showMessage({
        title: "Tải dữ liệu thất bại",
        message:
          error.response?.data?.message ||
          "Không tải được danh sách phần thưởng.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setCurrentPage(1);
    await loadRewards();
  }

  const statistics = useMemo(() => {
    return rewards.reduce(
      (result, reward) => {
        result.total += 1;

        const status = normalizeValue(
          reward.status
        );

        if (status === "active") {
          result.active += 1;
        } else {
          result.inactive += 1;
        }

        if (reward.welcomeReward) {
          result.welcome += 1;
        }

        return result;
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
        welcome: 0,
      }
    );
  }, [rewards]);

  const filteredRewards = useMemo(() => {
    const normalizedKeyword =
      normalizeValue(keyword);

    return rewards.filter((reward) => {
      const searchableText = [
        reward.rewardId,
        reward.rewardName,
        reward.rewardType,
        reward.rewardValue,
        reward.requiredPoints,
        reward.vehicleType,
        reward.status,
        reward.requiredTierLevel,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      const matchesKeyword =
        !normalizedKeyword ||
        searchableText.includes(
          normalizedKeyword
        );

      const matchesStatus =
        statusFilter === "all" ||
        normalizeValue(reward.status) ===
        statusFilter;

      const matchesType =
        typeFilter === "all" ||
        normalizeValue(reward.rewardType) ===
        typeFilter;

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    rewards,
    keyword,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    statusFilter,
    typeFilter,
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

  const firstVisibleItem =
    filteredRewards.length === 0
      ? 0
      : (currentPage - 1) *
      pageSize +
      1;

  const lastVisibleItem = Math.min(
    currentPage * pageSize,
    filteredRewards.length
  );

  function openCreateForm() {
    setEditingReward(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEditForm(reward) {
    setEditingReward(reward);

    setFormData({
      rewardName:
        reward.rewardName || "",

      requiredPoints:
        reward.requiredPoints ?? "",

      rewardType:
        normalizeValue(
          reward.rewardType
        ) || "discount",

      rewardValue:
        reward.rewardValue ?? "",

      vehicleType:
        normalizeValue(
          reward.vehicleType
        ) || "car",

      status:
        normalizeValue(reward.status) ||
        "active",

      requiredTierLevel:
        reward.requiredTierLevel ?? "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingReward(null);
    setFormData(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const rewardName =
      formData.rewardName.trim();

    const requiredPoints = Number(
      formData.requiredPoints
    );

    const rewardValue = Number(
      formData.rewardValue
    );

    if (!rewardName) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Vui lòng nhập tên phần thưởng.",
        variant: "warning",
      });
      return;
    }

    if (
      !Number.isFinite(requiredPoints) ||
      requiredPoints < 1
    ) {
      await showMessage({
        title: "Số điểm không hợp lệ",
        message: "Số điểm cần đổi phải từ 1 trở lên.",
        variant: "warning",
      });
      return;
    }

    if (
      !Number.isFinite(rewardValue) ||
      rewardValue <= 0
    ) {
      await showMessage({
        title: "Giá trị không hợp lệ",
        message: "Giá trị phần thưởng phải lớn hơn 0.",
        variant: "warning",
      });
      return;
    }

    const payload = {
      rewardName,
      requiredPoints,
      rewardType: formData.rewardType,
      rewardValue,
      vehicleType:
        formData.vehicleType || "car",
      status:
        formData.status || "active",
      requiredTierLevel:
        formData.requiredTierLevel === ""
          ? null
          : Number(
            formData.requiredTierLevel
          ),
    };

    setSaving(true);

    try {
      const isEditing = Boolean(editingReward);

      if (isEditing) {
        const rewardId =
          editingReward.rewardId ||
          editingReward.id;

        await rewardApi.update(
          rewardId,
          payload
        );
      } else {
        await rewardApi.create(payload);
      }

      closeForm();
      setCurrentPage(1);
      await loadRewards();

      await showMessage({
        title: "Thành công",
        message: isEditing
          ? "Cập nhật phần thưởng thành công."
          : "Tạo phần thưởng thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Save reward failed:",
        error
      );

      await showMessage({
        title: "Lưu phần thưởng thất bại",
        message:
          error.response?.data?.message ||
          "Lưu phần thưởng thất bại.",
        variant: "error",
      });

    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(reward) {
    const rewardId =
      reward.rewardId || reward.id;

    if (!rewardId) {
      await showMessage({
        title: "Thiếu dữ liệu",
        message: "Không tìm thấy rewardId.",
        variant: "error",
      });
      return;
    }

    const rewardName =
      reward.rewardName ||
      `#${rewardId}`;

    const confirmed = await confirmAction({
      title: "Vô hiệu hóa phần thưởng",
      message: `Bạn có chắc muốn vô hiệu hóa phần thưởng "${rewardName}" không?`,
      confirmText: "Vô hiệu hóa",
      cancelText: "Hủy",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await rewardApi.deactivate(rewardId);
      await loadRewards();

      await showMessage({
        title: "Thành công",
        message: "Vô hiệu hóa phần thưởng thành công.",
        variant: "success",
      });
    } catch (error) {
      console.error(
        "Deactivate reward failed:",
        error
      );

      await showMessage({
        title: "Vô hiệu hóa thất bại",
        message:
          error.response?.data?.message ||
          "Vô hiệu hóa phần thưởng thất bại.",
        variant: "error",
      });
    }
  }

  return (
    <div className="reward-admin-page">
      <div className="reward-admin-header">
        <div>
          <h1>Phần thưởng đổi điểm</h1>

          <p>
            Tạo và quản lý các phần thưởng mà khách hàng có thể đổi bằng điểm.
          </p>
        </div>

        <div className="reward-header-actions">
          <button
            type="button"
            className="reward-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={18}
              className={
                loading
                  ? "reward-spinning"
                  : ""
              }
            />

            {loading
              ? "Đang tải..."
              : "Làm mới"}
          </button>

          <button
            type="button"
            className="reward-create-btn"
            onClick={openCreateForm}
          >
            <Plus size={18} />
            Tạo phần thưởng
          </button>
        </div>
      </div>

      <div className="reward-stat-grid">
        <div className="reward-stat-card">
          <Gift size={22} />
          <div>
            <span>Tổng phần thưởng</span>
            <strong>
              {statistics.total}
            </strong>
          </div>
        </div>

        <div className="reward-stat-card active">
          <Gift size={22} />
          <div>
            <span>Đang hoạt động</span>
            <strong>
              {statistics.active}
            </strong>
          </div>
        </div>

        <div className="reward-stat-card inactive">
          <Ban size={22} />
          <div>
            <span>Đã vô hiệu hóa</span>
            <strong>
              {statistics.inactive}
            </strong>
          </div>
        </div>

        <div className="reward-stat-card welcome">
          <Gift size={22} />
          <div>
            <span>Quà thăng hạng</span>
            <strong>
              {statistics.welcome}
            </strong>
          </div>
        </div>
      </div>

      <div className="reward-filter-card">
        <div className="reward-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Tìm theo tên, loại, điểm hoặc ID..."
            value={keyword}
            onChange={(event) =>
              setKeyword(
                event.target.value
              )
            }
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            Tất cả loại phần thưởng
          </option>

          <option value="discount">
            Giảm giá
          </option>

          <option value="free_wash">
            Miễn phí rửa xe
          </option>

          <option value="addon">
            Tặng dịch vụ phụ
          </option>
        </select>

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

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      <div className="reward-table-card">
        {loading ? (
          <div className="reward-empty-state">
            Đang tải danh sách phần thưởng...
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="reward-empty-state">
            Không có phần thưởng phù hợp.
          </div>
        ) : (
          <>
            <div className="reward-table-wrap">
              <table className="reward-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên phần thưởng</th>
                    <th>Loại</th>
                    <th>Điểm cần đổi</th>
                    <th>Giá trị</th>
                    <th>Loại xe</th>
                    <th>Hạng tối thiểu</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRewards.map(
                    (reward, index) => (
                      <tr
                        key={
                          reward.rewardId ||
                          reward.id ||
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
                          <strong className="reward-name">
                            {reward.rewardName ||
                              "N/A"}
                          </strong>

                          {reward.welcomeReward && (
                            <small className="welcome-label">
                              Quà thăng hạng
                            </small>
                          )}
                        </td>

                        <td>
                          <span
                            className={`reward-type-badge ${getRewardTypeClass(
                              reward.rewardType
                            )}`}
                          >
                            {getRewardTypeLabel(
                              reward.rewardType
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="reward-points">
                            {formatNumber(
                              reward.requiredPoints
                            )}{" "}
                            điểm
                          </strong>
                        </td>

                        <td>
                          {getRewardValueLabel(
                            reward
                          )}
                        </td>

                        <td>
                          {reward.vehicleType ||
                            "car"}
                        </td>

                        <td>
                          {reward.requiredTierLevel ??
                            "Không yêu cầu"}
                        </td>

                        <td>
                          <span
                            className={`reward-status-badge ${normalizeValue(
                              reward.status
                            )}`}
                          >
                            {reward.status ||
                              "N/A"}
                          </span>
                        </td>

                        <td>
                          {formatDateTime(
                            reward.createdAt
                          )}
                        </td>

                        <td>
                          <div className="reward-actions">
                            <button
                              type="button"
                              className="view"
                              title="Xem chi tiết"
                              onClick={() =>
                                setSelectedReward(
                                  reward
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="edit"
                              title="Sửa phần thưởng"
                              onClick={() =>
                                openEditForm(
                                  reward
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            {normalizeValue(
                              reward.status
                            ) ===
                              "active" && (
                                <button
                                  type="button"
                                  className="deactivate"
                                  title="Vô hiệu hóa"
                                  onClick={() =>
                                    handleDeactivate(
                                      reward
                                    )
                                  }
                                >
                                  <Ban
                                    size={16}
                                  />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="reward-pagination">
              <div className="reward-pagination-summary">
                Hiển thị{" "}
                <strong>
                  {firstVisibleItem}–
                  {lastVisibleItem}
                </strong>{" "}
                trong tổng số{" "}
                <strong>
                  {filteredRewards.length}
                </strong>{" "}
                phần thưởng
              </div>

              <div className="reward-pagination-controls">
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
                        className="reward-pagination-ellipsis"
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

              <label className="reward-page-size">
                <span>Mỗi trang</span>

                <select
                  value={pageSize}
                  onChange={(event) =>
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

      {showForm && (
        <div
          className="reward-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="reward-form-modal">
            <div className="reward-modal-header">
              <div>
                <span>
                  {editingReward
                    ? "Chỉnh sửa"
                    : "Tạo mới"}
                </span>

                <h2>
                  {editingReward
                    ? editingReward.rewardName
                    : "Phần thưởng đổi điểm"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="reward-form"
              onSubmit={handleSubmit}
            >
              <div className="reward-form-grid">
                <div className="reward-form-group full">
                  <label>
                    Tên phần thưởng *
                  </label>

                  <input
                    name="rewardName"
                    maxLength={100}
                    value={
                      formData.rewardName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ví dụ: Giảm 50.000đ"
                    required
                  />
                </div>

                <div className="reward-form-group">
                  <label>
                    Số điểm cần đổi *
                  </label>

                  <input
                    type="number"
                    name="requiredPoints"
                    min="1"
                    value={
                      formData.requiredPoints
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="reward-form-group">
                  <label>
                    Loại phần thưởng *
                  </label>

                  <select
                    name="rewardType"
                    value={
                      formData.rewardType
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="discount">
                      Giảm giá
                    </option>

                    <option value="free_wash">
                      Miễn phí rửa xe
                    </option>

                    <option value="addon">
                      Tặng dịch vụ phụ
                    </option>
                  </select>
                </div>

                <div className="reward-form-group">
                  <label>
                    Giá trị phần thưởng *
                  </label>

                  <input
                    type="number"
                    name="rewardValue"
                    min="0.01"
                    step="0.01"
                    value={
                      formData.rewardValue
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="reward-form-group">
                  <label>Loại xe</label>

                  <select
                    name="vehicleType"
                    value={
                      formData.vehicleType
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="car">
                      Car
                    </option>
                  </select>
                </div>

                <div className="reward-form-group">
                  <label>
                    Hạng tối thiểu
                  </label>

                  <input
                    type="number"
                    name="requiredTierLevel"
                    min="1"
                    value={
                      formData.requiredTierLevel
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Để trống nếu không yêu cầu"
                  />
                </div>

                <div className="reward-form-group">
                  <label>Trạng thái</label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              <div className="reward-modal-actions">
                <button
                  type="button"
                  className="cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="save"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingReward
                      ? "Lưu thay đổi"
                      : "Tạo phần thưởng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReward && (
        <div
          className="reward-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedReward(null);
            }
          }}
        >
          <div className="reward-detail-modal">
            <div className="reward-modal-header">
              <div>
                <span>
                  Chi tiết phần thưởng
                </span>

                <h2>
                  {selectedReward.rewardName}
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

            <div className="reward-detail-grid">
              <div>
                <span>ID</span>
                <strong>
                  {selectedReward.rewardId}
                </strong>
              </div>

              <div>
                <span>Loại</span>
                <strong>
                  {getRewardTypeLabel(
                    selectedReward.rewardType
                  )}
                </strong>
              </div>

              <div>
                <span>Điểm cần đổi</span>
                <strong>
                  {formatNumber(
                    selectedReward.requiredPoints
                  )}{" "}
                  điểm
                </strong>
              </div>

              <div>
                <span>Giá trị</span>
                <strong>
                  {getRewardValueLabel(
                    selectedReward
                  )}
                </strong>
              </div>

              <div>
                <span>Loại xe</span>
                <strong>
                  {selectedReward.vehicleType ||
                    "car"}
                </strong>
              </div>

              <div>
                <span>
                  Hạng tối thiểu
                </span>
                <strong>
                  {selectedReward.requiredTierLevel ??
                    "Không yêu cầu"}
                </strong>
              </div>

              <div>
                <span>Trạng thái</span>
                <strong>
                  {selectedReward.status}
                </strong>
              </div>

              <div>
                <span>Ngày tạo</span>
                <strong>
                  {formatDateTime(
                    selectedReward.createdAt
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}