package com.autowash.backend.security;

import com.autowash.backend.user.entity.User;
import com.autowash.backend.user.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;


        @Service
        public class CustomUserDetailsService implements UserDetailsService {

            private final UserRepository userRepository;

            public CustomUserDetailsService(UserRepository userRepository) {
                this.userRepository = userRepository;
            }

            @Override
            @Transactional(readOnly = true)
            public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "Không tìm thấy người dùng với email: " + email));
                return new CustomUserDetails(user);
            }
        }
                        new UsernameNotFoundException(
                                "Không tìm thấy người dùng: " + username));

        return new CustomUserDetails(user);
    }
}
