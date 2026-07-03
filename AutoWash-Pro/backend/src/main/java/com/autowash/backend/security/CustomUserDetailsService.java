package com.autowash.backend.security;

import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


        @Service
        public class CustomUserDetailsService implements UserDetailsService {

            private final UserRepository userRepository;

            public CustomUserDetailsService(UserRepository userRepository) {
                this.userRepository = userRepository;
            }

            @Override
            @Transactional(readOnly = true)
            public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
                String trimmedIdentifier = identifier.trim();
                User user = userRepository.findByEmailIgnoreCase(trimmedIdentifier)
                        .or(() -> userRepository.findByUsernameIgnoreCase(trimmedIdentifier))
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "Không tìm thấy người dùng với tài khoản hoặc email: " + identifier));
                return new CustomUserDetails(user);
            }
        }
