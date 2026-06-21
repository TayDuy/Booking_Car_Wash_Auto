package com.autowash.backend.branch.service;

import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch.BranchStatus;

import java.util.List;

/**
 * Service interface định nghĩa các use-case nghiệp vụ của Branch.
 *
 * <p>Tách interface ra khỏi implementation để:</p>
 * <ul>
 *   <li>Dễ viết unit test – mock interface thay vì class cụ thể.</li>
 *   <li>Tuân theo Dependency Inversion Principle (SOLID).</li>
 *   <li>Cho phép swap implementation mà không sửa Controller.</li>
 * </ul>
 */
public interface BranchService {

    List<BranchResponseDTO> findAll(BranchStatus status);

    BranchResponseDTO findById(Integer branchId);

    BranchResponseDTO create(BranchRequestDTO request);

    BranchResponseDTO update(Integer branchId, BranchRequestDTO request);

    BranchResponseDTO changeStatus(Integer branchId, BranchStatus newStatus);

    void softDelete(Integer branchId);
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/develop
