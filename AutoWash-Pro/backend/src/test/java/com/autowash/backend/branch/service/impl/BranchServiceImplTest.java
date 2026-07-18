package com.autowash.backend.branch.service.impl;

import com.autowash.backend.branch.dto.BranchRequestDTO;
import com.autowash.backend.branch.dto.BranchResponseDTO;
import com.autowash.backend.branch.entity.Branch;
import com.autowash.backend.branch.entity.Branch.BranchStatus;
import com.autowash.backend.branch.mapper.BranchMapper;
import com.autowash.backend.branch.repository.BranchRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BranchServiceImplTest {

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private BranchMapper branchMapper;

    @InjectMocks
    private BranchServiceImpl branchService;

    @Test
    void testFindAllWithoutStatusReturnsAll() {
        Branch branch = Branch.builder().branchId(1).branchName("Quan 1").build();
        BranchResponseDTO dto = BranchResponseDTO.builder().branchId(1).branchName("Quan 1").build();

        when(branchRepository.findAll()).thenReturn(List.of(branch));
        when(branchMapper.toResponse(branch)).thenReturn(dto);

        List<BranchResponseDTO> result = branchService.findAll(null);

        assertEquals(1, result.size());
        assertEquals("Quan 1", result.get(0).getBranchName());
        verify(branchRepository).findAll();
        verify(branchRepository, never()).findByStatus(any());
    }

    @Test
    void testFindAllWithStatusFiltersByStatus() {
        Branch branch = Branch.builder().branchId(2).branchName("Quan 7").status(BranchStatus.inactive).build();
        BranchResponseDTO dto = BranchResponseDTO.builder().branchId(2).branchName("Quan 7").build();

        when(branchRepository.findByStatus(BranchStatus.inactive)).thenReturn(List.of(branch));
        when(branchMapper.toResponse(branch)).thenReturn(dto);

        List<BranchResponseDTO> result = branchService.findAll(BranchStatus.inactive);

        assertEquals(1, result.size());
        assertEquals("Quan 7", result.get(0).getBranchName());
        verify(branchRepository, never()).findAll();
        verify(branchRepository).findByStatus(BranchStatus.inactive);
    }

    @Test
    void testFindByIdSuccess() {
        Branch branch = Branch.builder().branchId(1).branchName("Quan 1").build();
        BranchResponseDTO dto = BranchResponseDTO.builder().branchId(1).branchName("Quan 1").build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(branch));
        when(branchMapper.toResponse(branch)).thenReturn(dto);

        BranchResponseDTO result = branchService.findById(1);

        assertEquals("Quan 1", result.getBranchName());
    }

    @Test
    void testFindByIdNotFoundThrowsException() {
        when(branchRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> branchService.findById(999));
    }

    @Test
    void testCreateSuccess() {
        BranchRequestDTO request = BranchRequestDTO.builder()
                .branchName("Chi nhanh moi")
                .address("123 Nguyen Hue")
                .phone("02812345678")
                .build();

        Branch entity = Branch.builder().branchName("Chi nhanh moi").address("123 Nguyen Hue").phone("02812345678").build();
        Branch saved = Branch.builder().branchId(10).branchName("Chi nhanh moi").address("123 Nguyen Hue").phone("02812345678").status(BranchStatus.active).build();
        BranchResponseDTO dto = BranchResponseDTO.builder().branchId(10).branchName("Chi nhanh moi").status(BranchStatus.active).build();

        when(branchRepository.existsByBranchName("Chi nhanh moi")).thenReturn(false);
        when(branchMapper.toEntity(request)).thenReturn(entity);
        when(branchRepository.save(any(Branch.class))).thenReturn(saved);
        when(branchMapper.toResponse(saved)).thenReturn(dto);

        BranchResponseDTO result = branchService.create(request);

        assertEquals(10, result.getBranchId());
        assertEquals(BranchStatus.active, result.getStatus());
        verify(branchRepository).existsByBranchName("Chi nhanh moi");
    }

    @Test
    void testCreateDuplicateNameThrowsException() {
        BranchRequestDTO request = BranchRequestDTO.builder()
                .branchName("Chi nhanh moi")
                .address("123 Nguyen Hue")
                .phone("02812345678")
                .build();

        when(branchRepository.existsByBranchName("Chi nhanh moi")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> branchService.create(request));
        verify(branchRepository, never()).save(any());
    }

    @Test
    void testUpdateBranchSuccess() {
        Branch existing = Branch.builder().branchId(1).branchName("Quan 1").address("Old addr").build();
        BranchRequestDTO request = BranchRequestDTO.builder()
                .branchName("Quan 1 Updated")
                .address("New addr")
                .phone("02811111111")
                .build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(existing));
        when(branchRepository.existsByBranchNameAndBranchIdNot("Quan 1 Updated", 1)).thenReturn(false);
        when(branchRepository.save(any(Branch.class))).thenReturn(existing);
        when(branchMapper.toResponse(any())).thenReturn(BranchResponseDTO.builder().branchId(1).branchName("Quan 1 Updated").build());

        BranchResponseDTO result = branchService.update(1, request);

        assertEquals("Quan 1 Updated", result.getBranchName());
        verify(branchMapper).updateEntity(request, existing);
    }

    @Test
    void testChangeStatusSuccess() {
        Branch branch = Branch.builder().branchId(1).status(BranchStatus.active).build();
        Branch saved = Branch.builder().branchId(1).status(BranchStatus.inactive).build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(branch));
        when(branchRepository.save(any(Branch.class))).thenReturn(saved);
        when(branchMapper.toResponse(any())).thenReturn(BranchResponseDTO.builder().branchId(1).status(BranchStatus.inactive).build());

        BranchResponseDTO result = branchService.changeStatus(1, BranchStatus.inactive);

        assertEquals(BranchStatus.inactive, result.getStatus());
        verify(branchRepository).save(branch);
    }

    @Test
    void testSoftDeleteSetsStatusInactive() {
        Branch branch = spy(Branch.builder().branchId(1).status(BranchStatus.active).build());
        Branch saved = Branch.builder().branchId(1).status(BranchStatus.inactive).build();

        when(branchRepository.findById(1)).thenReturn(Optional.of(branch));
        when(branchRepository.save(any(Branch.class))).thenReturn(saved);

        branchService.softDelete(1);

        verify(branch).setStatus(BranchStatus.inactive);
        verify(branchRepository).save(branch);
    }
}
